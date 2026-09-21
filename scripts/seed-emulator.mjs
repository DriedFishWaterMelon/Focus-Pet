#!/usr/bin/env node
//
// Seeds the Firestore emulator with data shaped exactly like the app writes it.
//
// This exists so the export pipeline can be tested end to end without touching
// real participant data, and so a new team member can see what the CSV output
// looks like before anyone has been recruited. It refuses to run against a real
// project — writing fake participants into the live study database would
// silently corrupt the results.
//
// Usage:
//   firebase emulators:exec --only firestore --project focus-pet-g8 \
//     "node scripts/seed-emulator.mjs <serviceAccount.json> && node scripts/export-research-data.mjs --key <serviceAccount.json> --out ./export"

import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    '\nปฏิเสธการรัน: ไม่พบ FIRESTORE_EMULATOR_HOST\n' +
      'สคริปต์นี้เขียนข้อมูลปลอม จึงรันได้เฉพาะกับ emulator เท่านั้น\n' +
      'ถ้ารันกับโปรเจกต์จริง ข้อมูลวิจัยจะปนเปื้อน\n',
  )
  process.exit(1)
}

const keyPath = process.argv[2]
if (!keyPath) {
  console.error('ใช้: node seed-emulator.mjs <serviceAccount.json>')
  process.exit(1)
}

initializeApp({
  credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))),
  projectId: 'focus-pet-g8',
})
const db = getFirestore()

const DAY = 86_400_000
const base = Date.parse('2026-09-15T10:00:00Z')

async function seedUser(uid, participantId, opts = {}) {
  const ref = db.collection('users').doc(uid)
  await ref.set({ participantId, onboarded: true, consentedAt: base })

  await ref.collection('state').doc('pet').set({
    name: opts.name ?? 'Sproutly',
    species: opts.species ?? 'leaf',
    generation: opts.generation ?? 1,
    level: 4,
    totalFocusMinutes: opts.total ?? 120,
    streakDays: 3,
    isAlive: opts.alive !== false,
    diedAt: opts.alive === false ? base + DAY * 3 : null,
    bornAt: base,
  })

  for (let i = 0; i < (opts.sessions ?? 3); i++) {
    await ref.collection('sessions').add({
      targetMinutes: 25,
      actualMinutes: 25,
      startTime: base + i * DAY,
      endTime: base + i * DAY + 1_500_000,
      completed: true,
      expEarned: 70,
      coinsEarned: 35,
      itemRewardName: 'Matcha Focus Brew',
      tag: 'Study',
      // One interrupted session per participant, so the export's data-quality
      // split has something to report.
      source: i === 1 ? 'web_timer_interrupted' : 'web_timer_verified',
    })
  }

  for (let i = 0; i < 2; i++) {
    const date = new Date(base + i * DAY).toISOString().slice(0, 10)
    await ref.collection('screenTimeDays').doc(date).set({
      date,
      minutes: 320 - i * 40,
      source: 'self_reported',
      recordedAt: base + i * DAY,
    })
  }
}

await seedUser('uid_alpha', 'P001', { name: 'น้องเขียว', sessions: 3 })
await seedUser('uid_beta', 'P002', { name: 'Nara', species: 'flame', sessions: 2, alive: false, generation: 2 })

// Someone who opened the app but never enrolled. The export must leave this
// person out unless --all is passed, or they would pollute the dataset.
await db.collection('users').doc('uid_casual').set({ participantId: '', onboarded: true })
await db.collection('users').doc('uid_casual').collection('sessions').add({
  targetMinutes: 15,
  actualMinutes: 15,
  startTime: base,
  endTime: base + 900_000,
  completed: true,
  expEarned: 50,
  coinsEarned: 18,
  itemRewardName: null,
  tag: 'Deep Work',
  source: 'web_timer_verified',
})

console.log('seeded: P001 (3 sessions), P002 (2 sessions, pet died), 1 unenrolled user')
