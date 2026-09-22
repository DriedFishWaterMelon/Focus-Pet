import { doc, setDoc } from 'firebase/firestore'
import { db, paths } from './firebase'
import { CONSENT_VERSION } from './consent'
import { acceptsConsentVersion } from './types'
import type { Enrolment } from './types'

// App-usage records.
//
// The study asks whether the app reduces screen time. These records answer the
// next question — which parts of it did the work — by recording how often
// participants come back, how long they stay, and what they do while they are
// here.
//
// Written as one document per visit rather than one per tap. A screen-view
// event on every route change would be thousands of writes per participant over
// four weeks, and for an app whose point is to be used *less*, counting visits
// and totals is both cheaper and closer to the actual question.
//
// Nothing is collected unless the participant accepted the consent text that
// lists these records. A v1 participant keeps sending exactly what v1 described.

export type ScreenName = 'home' | 'focus' | 'shop' | 'stats' | 'inventory' | 'settings'
export type CareAction = 'feed' | 'pat' | 'purchase'
export type OpenSource = 'direct' | 'notification'

/**
 * Set when a reminder brought the participant here, and cleared by the next
 * visit that reads it.
 *
 * A notification arrives one of two ways: it opens a new tab carrying a marker
 * in the URL, or it focuses a tab that is already open and tells the page over
 * postMessage. Both funnel into this single one-shot flag, because the
 * alternative — reading the URL on every visit — would mark every later return
 * to a tab as reminder-driven for as long as that tab stayed open.
 */
let pendingNotificationOpen = false

/** Called when the service worker reports that a reminder was tapped. */
export function markNotificationOpen(): void {
  pendingNotificationOpen = true
}

/** Reads the marker a freshly opened tab carries, and removes it from the URL. */
function consumeUrlMarker(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('from') !== 'notification') return false
  params.delete('from')
  const query = params.toString()
  window.history.replaceState(
    null,
    '',
    window.location.pathname + (query ? `?${query}` : '') + window.location.hash,
  )
  return true
}

interface VisitDraft {
  id: string
  openedAt: number
  openedFrom: OpenSource
  screens: Partial<Record<ScreenName, number>>
  actions: Partial<Record<CareAction, number>>
  flushedAt: number
}

let visit: VisitDraft | null = null
let uid: string | null = null
let enabled = false

/** How often an open visit is written back while it is still running. */
const FLUSH_INTERVAL_MS = 120_000

function screenFromPath(pathname: string): ScreenName {
  if (pathname.startsWith('/focus')) return 'focus'
  if (pathname.startsWith('/shop')) return 'shop'
  if (pathname.startsWith('/stats')) return 'stats'
  if (pathname.startsWith('/inventory')) return 'inventory'
  if (pathname.startsWith('/settings')) return 'settings'
  return 'home'
}

/**
 * Starts recording a visit.
 *
 * Called once the participant is known. Returns silently when they are not
 * enrolled, or are enrolled under an older consent text.
 */
export function startVisit(userId: string, enrolment: Enrolment): void {
  enabled = acceptsConsentVersion(enrolment, CONSENT_VERSION)
  uid = userId
  if (!enabled) {
    visit = null
    return
  }

  // Read both signals every time, so a marker left over from a previous visit
  // cannot survive into this one.
  const fromNotification = consumeUrlMarker() || pendingNotificationOpen
  pendingNotificationOpen = false

  const openedAt = Date.now()
  visit = {
    // The id encodes the open time so a visit is written to a stable document
    // and can be updated in place rather than duplicated on every flush.
    id: `${openedAt}`,
    openedAt,
    openedFrom: fromNotification ? 'notification' : 'direct',
    screens: {},
    actions: {},
    flushedAt: 0,
  }
  void flush(false)
}

export function recordScreen(pathname: string): void {
  if (!enabled || !visit) return
  const screen = screenFromPath(pathname)
  visit.screens[screen] = (visit.screens[screen] ?? 0) + 1
}

export function recordAction(action: CareAction): void {
  if (!enabled || !visit) return
  visit.actions[action] = (visit.actions[action] ?? 0) + 1
}

/**
 * Writes the visit so far.
 *
 * `final` marks the visit as closed and stamps its duration. Flushing also
 * happens periodically and whenever the tab is hidden, because a browser being
 * closed does not reliably give a page the chance to write anything — without
 * interim flushes, every visit that ended by closing the tab would be lost.
 */
export async function flush(final: boolean): Promise<void> {
  if (!enabled || !visit || !uid) return

  const now = Date.now()
  if (!final && now - visit.flushedAt < FLUSH_INTERVAL_MS && visit.flushedAt !== 0) return
  visit.flushedAt = now

  try {
    await setDoc(
      doc(db, paths.appVisits(uid), visit.id),
      {
        openedAt: visit.openedAt,
        openedFrom: visit.openedFrom,
        lastSeenAt: now,
        durationSeconds: Math.round((now - visit.openedAt) / 1000),
        closed: final,
        screens: visit.screens,
        actions: visit.actions,
        consentVersion: CONSENT_VERSION,
      },
      { merge: true },
    )
  } catch {
    // Usage records are secondary. Losing one must never disturb the session
    // data the study actually depends on.
  }
}

/** Ends the current visit and writes it out. */
export async function endVisit(): Promise<void> {
  await flush(true)
  visit = null
}

/** Clears state on sign-out so a visit cannot be attributed to the next user. */
export function resetVisit(): void {
  visit = null
  uid = null
  enabled = false
  pendingNotificationOpen = false
}

export function isTelemetryEnabled(): boolean {
  return enabled
}
