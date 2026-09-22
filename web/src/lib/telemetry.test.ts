import { describe, expect, it } from 'vitest'
import { CONSENT_SHEET, CONSENT_VERSION } from './consent'
import { acceptsConsentVersion, emptyEnrolment, needsReconsent } from './types'
import type { Enrolment } from './types'

// App-usage records are the one thing in this project that is collected
// continuously in the background, so the gate in front of them is the part
// worth testing hardest. A participant must only ever have collected from them
// what the consent text they personally read said would be collected.

function enrolledOn(version: string | null): Enrolment {
  return {
    ...emptyEnrolment(),
    status: 'consented',
    consentVersion: version,
    consentedAt: 1_700_000_000_000,
  }
}

describe('consent version gate', () => {
  it('allows collection only for the version currently shipping', () => {
    expect(acceptsConsentVersion(enrolledOn(CONSENT_VERSION), CONSENT_VERSION)).toBe(true)
  })

  it('refuses someone who agreed to an older text', () => {
    // This is the whole point of versioning. A participant who consented to
    // v1 agreed to a shorter list of collected data; silently extending it
    // when the app updates would be collecting without consent.
    const old = enrolledOn('2026-09-22.v1')
    expect(acceptsConsentVersion(old, CONSENT_VERSION)).toBe(false)
    expect(needsReconsent(old, CONSENT_VERSION)).toBe(true)
  })

  it('refuses everyone who is not enrolled, whatever their version says', () => {
    for (const status of ['undecided', 'declined', 'withdrawn'] as const) {
      const enrolment: Enrolment = { ...enrolledOn(CONSENT_VERSION), status }
      expect(acceptsConsentVersion(enrolment, CONSENT_VERSION)).toBe(false)
      // Someone who withdrew is not asked to re-consent; they opted out.
      expect(needsReconsent(enrolment, CONSENT_VERSION)).toBe(false)
    }
  })

  it('refuses an enrolment with no recorded version', () => {
    // A consented record with a null version predates versioning, so there is
    // no evidence of what that person actually agreed to.
    expect(acceptsConsentVersion(enrolledOn(null), CONSENT_VERSION)).toBe(false)
    expect(needsReconsent(enrolledOn(null), CONSENT_VERSION)).toBe(true)
  })
})

describe('consent sheet discloses what the app records about itself', () => {
  const body = CONSENT_SHEET.flatMap((s) => s.body).join(' ')

  it('names every category of app-usage record', () => {
    // Each of these corresponds to a field written by telemetry.ts. If a field
    // is added there without a line here, consent stops being informed — this
    // test is what makes that a failing build rather than an ethics problem
    // discovered after the study.
    for (const phrase of [
      'จำนวนครั้งที่เปิดแอป',
      'ระยะเวลาที่เปิดค้างไว้',
      'หน้าที่เข้าใช้',
      'ให้อาหาร',
      'ซื้อไอเทม',
      'การแจ้งเตือน',
      'หยุดกลางคัน',
    ]) {
      expect(body).toContain(phrase)
    }
  })

  it('states the limits of the usage records', () => {
    // Counts and totals, not a keystroke log. Saying so is what makes the
    // collection proportionate to a coursework study.
    expect(body).toContain('ไม่มีการบันทึกว่าท่านกดอะไรทีละปุ่ม')
  })

  it('is on a version later than the text that omitted usage records', () => {
    expect(CONSENT_VERSION).not.toBe('2026-09-22.v1')
  })
})
