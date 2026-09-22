import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { doc, deleteField, setDoc } from 'firebase/firestore'
import { app, db, paths } from './firebase'
import type { Pet } from './types'

// Push reminders.
//
// Participants run this study for four weeks. A pet that quietly starves while
// its owner forgets the tab exists is the most likely way someone drops out, so
// a reminder is the difference between a participant and a lost row.
//
// Sending is done by scripts/send-reminders.mjs, run by the research team —
// Cloud Functions would need the paid Blaze plan, while a script run from a
// laptop with the Admin SDK costs nothing. The browser's only job is to hand
// over a token and say when the pet will next need help.

/**
 * Web Push needs the key pair from
 * Firebase Console → Project settings → Cloud Messaging → Web Push certificates.
 * Absent, everything below degrades to doing nothing rather than throwing.
 */
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? ''

export const PUSH_CONFIGURED = VAPID_KEY.length > 0

export type PushState = 'unsupported' | 'unconfigured' | 'default' | 'granted' | 'denied'

export async function pushState(): Promise<PushState> {
  if (!('Notification' in window)) return 'unsupported'
  if (!(await isSupported().catch(() => false))) return 'unsupported'
  if (!PUSH_CONFIGURED) return 'unconfigured'
  return Notification.permission as PushState
}

/**
 * Asks for permission and stores the resulting token.
 *
 * Returns false for every failure — a blocked prompt, an unsupported browser, a
 * missing key — because none of them should stop someone using the app.
 */
export async function enablePush(uid: string): Promise<boolean> {
  try {
    if (!PUSH_CONFIGURED) return false
    if (!(await isSupported())) return false

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const registration = await navigator.serviceWorker.ready
    const token = await getToken(getMessaging(app), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (!token) return false

    await setDoc(
      doc(db, paths.push(uid)),
      { token, platform: navigator.userAgent.slice(0, 120), updatedAt: Date.now() },
      { merge: true },
    )
    return true
  } catch {
    return false
  }
}

/** Stops reminders by removing the token the sender reads. */
export async function disablePush(uid: string): Promise<void> {
  try {
    await setDoc(doc(db, paths.push(uid)), { token: deleteField(), updatedAt: Date.now() }, { merge: true })
  } catch {
    // Nothing to undo if the write fails; the next enable overwrites it anyway.
  }
}

/**
 * Publishes when the pet will next need attention, for the sender to read.
 *
 * The timestamp is computed by gameLogic so the reminder rules live with the
 * rest of the game rules rather than being restated in the sending script.
 */
export async function publishAttentionSchedule(
  uid: string,
  pet: Pet,
  attentionAt: number | null,
): Promise<void> {
  try {
    await setDoc(
      doc(db, paths.push(uid)),
      {
        attentionAt,
        petName: pet.name,
        isAlive: pet.isAlive,
        updatedAt: Date.now(),
      },
      { merge: true },
    )
  } catch {
    // A failed schedule write costs one reminder, never the session data.
  }
}

/** Shows a notification for a push that arrived while the app is in the foreground. */
export function listenForForegroundPush(onShow: (title: string, body: string) => void): void {
  try {
    if (!PUSH_CONFIGURED) return
    onMessage(getMessaging(app), (payload) => {
      const title = payload.notification?.title ?? 'Focus Pet'
      const body = payload.notification?.body ?? ''
      onShow(title, body)
    })
  } catch {
    // Messaging is unavailable in this browser; foreground pushes simply do not arrive.
  }
}
