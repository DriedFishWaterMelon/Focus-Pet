#!/usr/bin/env node
//
// Sends "your pet needs you" reminders.
//
// Participants run this study for four weeks. A pet that quietly starves while
// its owner forgets the app exists is the most likely way someone drops out, so
// a nudge is the difference between a participant and a lost row.
//
// Sending lives here rather than in a Cloud Function because Functions require
// the paid Blaze plan, while running this from a laptop with the Admin SDK
// costs nothing. Run it once or twice a day.
//
// Usage:
//   node send-reminders.mjs --key ./serviceAccount.json
//   node send-reminders.mjs --key ./serviceAccount.json --dry-run
//
// Flags:
//   --key <path>   Service account JSON (required)
//   --dry-run      Report who would be messaged without sending anything
//   --quiet-hours  Skip sending between these hours, local time (default 22-8)
//
// Windows: schedule it with Task Scheduler. macOS/Linux: cron, e.g.
//   0 19 * * *  cd /path/to/scripts && node send-reminders.mjs --key ./serviceAccount.json

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { key: null, dryRun: false, quietFrom: 22, quietTo: 8 }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--key') args.key = argv[++i]
    else if (argv[i] === '--dry-run') args.dryRun = true
    else if (argv[i] === '--quiet-hours') {
      const [from, to] = String(argv[++i]).split('-').map(Number)
      args.quietFrom = from
      args.quietTo = to
    }
  }
  return args
}

const args = parseArgs(process.argv.slice(2))

if (!args.key) {
  console.error(`
ไม่ได้ระบุ service account key

  node send-reminders.mjs --key ./serviceAccount.json

ใช้ไฟล์เดียวกับสคริปต์ดึงข้อมูล (scripts/serviceAccount.json)
`)
  process.exit(1)
}

const keyPath = resolve(args.key)
if (!existsSync(keyPath)) {
  console.error(`หาไฟล์ key ไม่เจอ: ${keyPath}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

/**
 * Never message the same person twice within this window.
 *
 * The app is meant to reduce screen time. A reminder that arrives more than
 * once a day would be the app doing the exact thing it asks participants to
 * stop doing, and it would show up in the satisfaction scores.
 */
const MIN_HOURS_BETWEEN_REMINDERS = 20

function inQuietHours(hour, from, to) {
  // Handles a window that wraps past midnight, e.g. 22 to 8.
  return from > to ? hour >= from || hour < to : hour >= from && hour < to
}

function messageFor(pet, push) {
  const name = push.petName || pet.name || 'สัตว์เลี้ยงของคุณ'

  if (pet.health <= 20) {
    return {
      tag: 'critical',
      title: `💔 ${name} อ่อนแอมาก`,
      body: 'ใกล้จะไม่ไหวแล้ว รีบเปิดแอปให้ยาด่วน',
    }
  }
  if (pet.health < 50) {
    return {
      tag: 'sick',
      title: `🤒 ${name} ไม่สบาย`,
      body: 'ต้องการยาสมุนไพร เปิดแอปเพื่อดูแล',
    }
  }
  return {
    tag: 'hungry',
    title: `🍃 ${name} หิวแล้ว`,
    body: 'แวะมาให้อาหารหน่อย แล้วเริ่มเวลาปลอดหน้าจอกันต่อ',
  }
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

async function main() {
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
  initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore()
  const messaging = getMessaging()

  const now = Date.now()
  const hour = new Date().getHours()

  if (inQuietHours(hour, args.quietFrom, args.quietTo)) {
    console.log(
      `ตอนนี้ ${hour}:00 อยู่ในช่วงเวลาห้ามรบกวน (${args.quietFrom}:00–${args.quietTo}:00) ไม่ส่งอะไร`,
    )
    return
  }

  console.log(`\nโปรเจกต์: ${serviceAccount.project_id}`)
  console.log(args.dryRun ? 'โหมดทดลอง ไม่ส่งจริง\n' : 'กำลังส่งการแจ้งเตือน…\n')

  const usersSnap = await db.collection('users').get()

  let sent = 0
  let skippedNoToken = 0
  let skippedNotDue = 0
  let skippedRecent = 0
  let skippedDead = 0
  let failed = 0

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id
    const [pushSnap, petSnap] = await Promise.all([
      userDoc.ref.collection('state').doc('push').get(),
      userDoc.ref.collection('state').doc('pet').get(),
    ])

    if (!pushSnap.exists || !petSnap.exists) {
      skippedNoToken++
      continue
    }

    const push = pushSnap.data()
    const pet = petSnap.data()

    if (!push.token) {
      skippedNoToken++
      continue
    }

    // A dead pet cannot be rescued, so a reminder would only rub it in.
    if (pet.isAlive === false) {
      skippedDead++
      continue
    }

    // attentionAt is written by the app from gameLogic.nextAttentionAt, so the
    // rule for "needs help" lives with the rest of the game rules rather than
    // being restated here and drifting.
    const due = push.attentionAt === null || (push.attentionAt ?? Infinity) <= now
    if (!due) {
      skippedNotDue++
      continue
    }

    const since = now - (push.lastRemindedAt ?? 0)
    if (since < MIN_HOURS_BETWEEN_REMINDERS * 3_600_000) {
      skippedRecent++
      continue
    }

    const message = messageFor(pet, push)

    if (args.dryRun) {
      console.log(`  [ทดลอง] ${uid.slice(0, 8)}… → ${message.title}`)
      sent++
      continue
    }

    try {
      await messaging.send({
        token: push.token,
        notification: { title: message.title, body: message.body },
        data: { tag: message.tag },
        webpush: {
          fcmOptions: { link: 'https://focus-pet-g8.web.app/' },
        },
      })
      await pushSnap.ref.set({ lastRemindedAt: now }, { merge: true })
      sent++
    } catch (error) {
      // A token goes stale when the participant clears site data or uninstalls.
      // Clearing it stops this script retrying a dead address every single day.
      const code = error.errorInfo?.code ?? ''
      if (
        code.includes('registration-token-not-registered') ||
        code.includes('invalid-argument')
      ) {
        await pushSnap.ref.set({ token: null, tokenInvalidAt: now }, { merge: true })
        console.log(`  ล้าง token ที่ใช้ไม่ได้แล้ว: ${uid.slice(0, 8)}…`)
      } else {
        console.log(`  ส่งไม่สำเร็จ ${uid.slice(0, 8)}…: ${error.message}`)
      }
      failed++
    }
  }

  console.log('')
  console.log(`ส่งแล้ว           : ${sent}`)
  console.log(`ยังไม่ถึงเวลา      : ${skippedNotDue}`)
  console.log(`เพิ่งเตือนไปแล้ว   : ${skippedRecent}`)
  console.log(`ไม่ได้เปิดแจ้งเตือน : ${skippedNoToken}`)
  console.log(`สัตว์เลี้ยงเสียชีวิต : ${skippedDead}`)
  if (failed > 0) console.log(`ส่งไม่สำเร็จ       : ${failed}`)
  console.log('')
}

main().catch((error) => {
  console.error('\nส่งการแจ้งเตือนไม่สำเร็จ:', error.message)
  process.exit(1)
})
