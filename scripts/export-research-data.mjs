#!/usr/bin/env node
//
// Aggregate research export for the Focus Pet study.
//
// The Firestore security rules deliberately stop any participant from reading
// another participant's documents, which is correct for privacy but means the
// research team cannot assemble the dataset from inside the app. This script is
// the intended way out: it runs with a service account, reads every enrolled
// participant's records, and writes the flat CSV tables that SPSS, R or pandas
// expect.
//
// Privacy: display names and email addresses are never written to the export.
// The analysis keys on participantId, which is the anonymous code the team
// assigns, so the output can be shared with an advisor without exposing who
// took part. The Firebase uid is included only so a specific record can be
// traced back for a data-quality question.
//
// Usage:
//   node export-research-data.mjs --key ./serviceAccount.json --out ./export
//   node export-research-data.mjs --key ./serviceAccount.json --all
//
// Flags:
//   --key   <path>  Service account JSON (required)
//   --out   <dir>   Output directory (default: ./export)
//   --all           Include users with no participant ID. Off by default so
//                   people who merely tried the app cannot pollute the dataset.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { out: './export', all: false, key: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--key') args.key = argv[++i]
    else if (argv[i] === '--out') args.out = argv[++i]
    else if (argv[i] === '--all') args.all = true
    else if (argv[i] === '--help' || argv[i] === '-h') args.help = true
  }
  return args
}

const args = parseArgs(process.argv.slice(2))

if (args.help) {
  console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(2, 28).join('\n'))
  process.exit(0)
}

if (!args.key) {
  console.error(`
ไม่ได้ระบุ service account key

  node export-research-data.mjs --key ./serviceAccount.json

วิธีสร้างไฟล์ key (ทำครั้งเดียว):
  1. เปิด https://console.firebase.google.com/project/focus-pet-g8/settings/serviceaccounts/adminsdk
  2. กด "Generate new private key" แล้วกด "Generate key"
  3. เซฟไฟล์ JSON ที่ได้ไว้ที่ scripts/serviceAccount.json

  ไฟล์นี้เปิดสิทธิ์เต็มกับฐานข้อมูล ห้าม commit ขึ้น git เด็ดขาด
  (ใส่ไว้ใน .gitignore ให้แล้ว)
`)
  process.exit(1)
}

const keyPath = resolve(args.key)
if (!existsSync(keyPath)) {
  console.error(`หาไฟล์ key ไม่เจอ: ${keyPath}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

function writeCsv(dir, name, headers, rows) {
  // The BOM makes Excel open Thai text and UTF-8 correctly instead of mojibake.
  writeFileSync(join(dir, name), '﻿' + toCsv(headers, rows), 'utf8')
  console.log(`  ${name.padEnd(24)} ${rows.length} แถว`)
}

const iso = (ms) => (typeof ms === 'number' && ms > 0 ? new Date(ms).toISOString() : '')

/** Local-date key matching the app's toIsoDate, so days line up with the client. */
function dateKey(ms) {
  if (typeof ms !== 'number' || ms <= 0) return ''
  const d = new Date(ms)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

async function main() {
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
  initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore()

  const outDir = resolve(args.out)
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  console.log(`\nโปรเจกต์: ${serviceAccount.project_id}`)
  console.log('กำลังดึงข้อมูล…\n')

  const usersSnap = await db.collection('users').get()

  const participantRows = []
  const sessionRows = []
  const screenTimeRows = []
  const surveyRows = []
  /** participantId -> date -> { screenTime, focusMinutes, sessions } */
  const daily = new Map()

  let skipped = 0

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id
    const user = userDoc.data() ?? {}
    const participantId = (user.participantId ?? '').trim()

    if (!participantId && !args.all) {
      skipped++
      continue
    }

    const pid = participantId || `UNENROLLED_${uid.slice(0, 8)}`

    const [petSnap, sessionsSnap, daysSnap, surveysSnap] = await Promise.all([
      userDoc.ref.collection('state').doc('pet').get(),
      userDoc.ref.collection('sessions').orderBy('endTime', 'asc').get(),
      userDoc.ref.collection('screenTimeDays').orderBy('date', 'asc').get(),
      userDoc.ref.collection('surveys').get(),
    ])

    const pet = petSnap.exists ? petSnap.data() : {}

    const ensureDay = (date) => {
      if (!daily.has(pid)) daily.set(pid, new Map())
      const forPid = daily.get(pid)
      if (!forPid.has(date)) {
        forPid.set(date, { screenTime: '', focusMinutes: 0, sessions: 0, interrupted: 0 })
      }
      return forPid.get(date)
    }

    for (const doc of sessionsSnap.docs) {
      const s = doc.data()
      sessionRows.push([
        pid,
        uid,
        doc.id,
        iso(s.startTime),
        iso(s.endTime),
        dateKey(s.endTime),
        s.targetMinutes ?? '',
        s.actualMinutes ?? '',
        s.completed === true ? 1 : 0,
        s.expEarned ?? '',
        s.coinsEarned ?? '',
        s.itemRewardName ?? '',
        s.tag ?? '',
        s.source ?? '',
      ])

      const day = ensureDay(dateKey(s.endTime))
      day.sessions++
      // Interrupted sessions are counted separately rather than dropped, so the
      // analysis can decide whether to include them instead of us deciding here.
      if (s.source === 'web_timer_interrupted') day.interrupted++
      else day.focusMinutes += Number(s.actualMinutes) || 0
    }

    for (const doc of daysSnap.docs) {
      const d = doc.data()
      screenTimeRows.push([
        pid,
        uid,
        d.date ?? doc.id,
        d.minutes ?? '',
        d.source ?? '',
        iso(d.recordedAt),
      ])
      ensureDay(d.date ?? doc.id).screenTime = d.minutes ?? ''
    }

    for (const doc of surveysSnap.docs) {
      const s = doc.data()
      surveyRows.push([pid, uid, doc.id, s.instrument ?? '', s.phase ?? '', iso(s.recordedAt), JSON.stringify(s.answers ?? {})])
    }

    participantRows.push([
      pid,
      uid,
      user.onboarded === true ? 1 : 0,
      iso(user.consentedAt),
      pet.name ?? '',
      pet.species ?? '',
      pet.generation ?? '',
      pet.level ?? '',
      pet.totalFocusMinutes ?? '',
      pet.streakDays ?? '',
      pet.isAlive === false ? 0 : 1,
      iso(pet.diedAt),
      iso(pet.bornAt),
      sessionsSnap.size,
      daysSnap.size,
    ])
  }

  // --- daily summary: the table the statistics actually run on --------------
  const dailyRows = []
  for (const [pid, dates] of [...daily.entries()].sort()) {
    for (const [date, v] of [...dates.entries()].sort()) {
      if (!date) continue
      dailyRows.push([pid, date, v.screenTime, v.focusMinutes, v.sessions, v.interrupted])
    }
  }

  console.log('เขียนไฟล์:')

  writeCsv(
    outDir,
    'participants.csv',
    ['participant_id', 'uid', 'onboarded', 'consented_at', 'pet_name', 'pet_species',
     'pet_generation', 'pet_level', 'total_focus_minutes', 'streak_days', 'pet_alive',
     'pet_died_at', 'pet_born_at', 'session_count', 'screentime_day_count'],
    participantRows,
  )

  writeCsv(
    outDir,
    'sessions.csv',
    ['participant_id', 'uid', 'session_id', 'start_time_iso', 'end_time_iso', 'date',
     'target_minutes', 'actual_minutes', 'completed', 'exp_earned', 'coins_earned',
     'reward_item', 'tag', 'source'],
    sessionRows,
  )

  writeCsv(
    outDir,
    'screentime.csv',
    ['participant_id', 'uid', 'date', 'screen_time_minutes', 'source', 'recorded_at_iso'],
    screenTimeRows,
  )

  writeCsv(
    outDir,
    'daily_summary.csv',
    ['participant_id', 'date', 'screen_time_minutes', 'focus_minutes', 'session_count',
     'interrupted_count'],
    dailyRows,
  )

  if (surveyRows.length > 0) {
    writeCsv(
      outDir,
      'surveys.csv',
      ['participant_id', 'uid', 'survey_id', 'instrument', 'phase', 'recorded_at_iso', 'answers_json'],
      surveyRows,
    )
  }

  console.log(`\nเสร็จแล้ว → ${outDir}`)
  console.log(`ผู้เข้าร่วมที่มีรหัส: ${participantRows.length} คน`)
  if (skipped > 0) {
    console.log(`ข้ามผู้ใช้ที่ยังไม่มีรหัสผู้เข้าร่วม: ${skipped} คน (ใช้ --all ถ้าต้องการรวมด้วย)`)
  }

  // A dataset with no verified sessions usually means participants are only
  // self-reporting, which changes how the results must be written up.
  const verified = sessionRows.filter((r) => r[13] === 'web_timer_verified').length
  const interrupted = sessionRows.filter((r) => r[13] === 'web_timer_interrupted').length
  console.log(`\nคุณภาพข้อมูลเซสชัน:`)
  console.log(`  จับเวลาบนเว็บ (เชื่อถือได้):  ${verified}`)
  console.log(`  ถูกขัดจังหวะ (ควรแยกวิเคราะห์): ${interrupted}`)
  console.log(`  เวลาหน้าจอที่กรอกเอง:          ${screenTimeRows.length} วัน\n`)
}

main().catch((error) => {
  console.error('\nดึงข้อมูลไม่สำเร็จ:', error.message)
  if (String(error.message).includes('PERMISSION_DENIED')) {
    console.error('ตรวจสอบว่า service account มีสิทธิ์ Cloud Datastore User หรือ Editor')
  }
  process.exit(1)
})
