import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, paths } from './firebase'
import { CONSENT_VERSION, generateParticipantId } from './consent'
import type { Enrolment } from './types'

// Enrolment writes, kept apart from the game store because they are the part of
// the app that carries research-ethics weight.

export type ClaimResult =
  | { ok: true; participantId: string }
  | { ok: false; reason: 'already-set' | 'exhausted' | 'error'; message: string }

/** How many fresh codes to try before giving up. */
const MAX_ATTEMPTS = 5

/**
 * Issues a participant code to the signed-in user.
 *
 * Codes must be unique across the study: two participants sharing one would
 * merge into a single record and neither set of data could be trusted.
 * Uniqueness cannot be checked by reading other users — the security rules
 * forbid exactly that — so each code gets its own document in a dedicated
 * `participantIds` collection and the claim is a transaction that fails if the
 * document already exists. On that failure a new code is generated and retried,
 * so a collision costs a round trip rather than corrupting the dataset.
 *
 * The claim document holds no personal data beyond the owner and a timestamp,
 * so being able to see that a code is taken reveals nothing about who took it.
 */
export async function claimParticipantId(
  uid: string,
  currentEnrolment: Enrolment,
): Promise<ClaimResult> {
  if (currentEnrolment.participantIdSetAt) {
    return {
      ok: false,
      reason: 'already-set',
      message: 'มีรหัสอยู่แล้ว',
    }
  }

  const userRef = doc(db, paths.user(uid))

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateParticipantId()
    const claimRef = doc(db, paths.participantId(code))

    try {
      await runTransaction(db, async (tx) => {
        const existing = await tx.get(claimRef)
        if (existing.exists() && existing.data()?.uid !== uid) throw new Error('TAKEN')
        tx.set(claimRef, { uid, claimedAt: serverTimestamp() })
        tx.set(userRef, { participantId: code, participantIdSetAt: Date.now() }, { merge: true })
      })
      return { ok: true, participantId: code }
    } catch (error) {
      if ((error as Error).message === 'TAKEN') continue
      return {
        ok: false,
        reason: 'error',
        message: 'ออกรหัสไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
      }
    }
  }

  return {
    ok: false,
    reason: 'exhausted',
    message: 'ออกรหัสไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  }
}

export async function recordConsent(uid: string): Promise<Enrolment> {
  const enrolment: Enrolment = {
    status: 'consented',
    consentVersion: CONSENT_VERSION,
    consentedAt: Date.now(),
    participantIdSetAt: null,
    withdrawnAt: null,
  }
  await setDoc(
    doc(db, paths.user(uid)),
    {
      enrolmentStatus: enrolment.status,
      consentVersion: enrolment.consentVersion,
      consentedAt: enrolment.consentedAt,
    },
    { merge: true },
  )
  return enrolment
}

export async function recordDecline(uid: string): Promise<Enrolment> {
  await setDoc(
    doc(db, paths.user(uid)),
    { enrolmentStatus: 'declined', consentVersion: CONSENT_VERSION, declinedAt: Date.now() },
    { merge: true },
  )
  return {
    status: 'declined',
    consentVersion: CONSENT_VERSION,
    consentedAt: null,
    participantIdSetAt: null,
    withdrawnAt: null,
  }
}

/**
 * Withdrawal stops collection immediately but does not delete what was already
 * gathered — erasing it needs the research team, and pretending otherwise in
 * the interface would be a false promise. The app says so plainly and offers
 * the contact address.
 */
export async function recordWithdrawal(uid: string, current: Enrolment): Promise<Enrolment> {
  const withdrawnAt = Date.now()
  await setDoc(
    doc(db, paths.user(uid)),
    { enrolmentStatus: 'withdrawn', withdrawnAt },
    { merge: true },
  )
  return { ...current, status: 'withdrawn', withdrawnAt }
}

/** Reads enrolment back from a user document written by any earlier version. */
export function enrolmentFromDoc(data: Record<string, unknown> | undefined): Enrolment {
  const status = data?.enrolmentStatus
  return {
    status:
      status === 'consented' || status === 'declined' || status === 'withdrawn'
        ? status
        : 'undecided',
    consentVersion: (data?.consentVersion as string) ?? null,
    consentedAt: (data?.consentedAt as number) ?? null,
    participantIdSetAt: (data?.participantIdSetAt as number) ?? null,
    withdrawnAt: (data?.withdrawnAt as number) ?? null,
  }
}

export async function fetchUserDoc(uid: string) {
  const snap = await getDoc(doc(db, paths.user(uid)))
  return snap.exists() ? (snap.data() as Record<string, unknown>) : undefined
}
