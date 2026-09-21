// Research data layer.
//
// The project is a study, not only a game: the proposal calls for a paired t-test on
// screen time and a Pearson correlation between screen-free time and sleep quality.
// That analysis is only as good as what gets written here, so this module keeps two
// rules:
//
//   1. Never invent a number. If a value is unknown it is absent, not defaulted.
//      (The Android app's ScreenTimeTracker returns a hardcoded 145 minutes when it
//      lacks permission, which would silently contaminate the dataset. Not repeated here.)
//   2. Every stored figure records how it was obtained, via SessionSource, so the
//      write-up can separate browser-timed minutes from self-reported ones.

import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'
import { db, paths } from './firebase'
import type { ScreenFreeSession, SessionSource } from './types'

/** A day's screen time as reported by the participant or by the companion app. */
export interface ScreenTimeDay {
  /** ISO date, YYYY-MM-DD, in the participant's local timezone. */
  date: string
  minutes: number
  source: SessionSource
  recordedAt: number
}

export async function logSession(
  uid: string,
  session: Omit<ScreenFreeSession, 'id'>,
): Promise<void> {
  await addDoc(collection(db, paths.sessions(uid)), session)
}

export async function logScreenTimeDay(uid: string, entry: ScreenTimeDay): Promise<void> {
  // One document per day, so a correction overwrites rather than double-counts.
  await setDoc(doc(db, paths.screenTimeDays(uid), entry.date), entry)
}

export async function fetchSessions(uid: string): Promise<ScreenFreeSession[]> {
  const snapshot = await getDocs(
    query(collection(db, paths.sessions(uid)), orderBy('endTime', 'desc')),
  )
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ScreenFreeSession)
}

export async function fetchScreenTimeDays(uid: string): Promise<ScreenTimeDay[]> {
  const snapshot = await getDocs(
    query(collection(db, paths.screenTimeDays(uid)), orderBy('date', 'asc')),
  )
  return snapshot.docs.map((d) => d.data() as ScreenTimeDay)
}

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

/**
 * Firestore is NoSQL, so the statistical analysis cannot be done with a query.
 * These exports produce the flat tables that SPSS, R or pandas expect.
 */
export function sessionsToCsv(participantId: string, sessions: ScreenFreeSession[]): string {
  return toCsv(
    [
      'participant_id',
      'session_id',
      'start_time_iso',
      'end_time_iso',
      'target_minutes',
      'actual_minutes',
      'completed',
      'exp_earned',
      'coins_earned',
      'reward_item',
      'tag',
      'source',
    ],
    sessions.map((s) => [
      participantId,
      s.id,
      new Date(s.startTime).toISOString(),
      new Date(s.endTime).toISOString(),
      s.targetMinutes,
      s.actualMinutes,
      s.completed,
      s.expEarned,
      s.coinsEarned,
      s.itemRewardName ?? '',
      s.tag,
      s.source,
    ]),
  )
}

export function screenTimeToCsv(participantId: string, days: ScreenTimeDay[]): string {
  return toCsv(
    ['participant_id', 'date', 'screen_time_minutes', 'source', 'recorded_at_iso'],
    days.map((d) => [
      participantId,
      d.date,
      d.minutes,
      d.source,
      new Date(d.recordedAt).toISOString(),
    ]),
  )
}

export function downloadCsv(filename: string, contents: string): void {
  // Prepend a BOM so Excel opens Thai text and UTF-8 correctly.
  const blob = new Blob(['﻿' + contents], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function todayIso(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}
