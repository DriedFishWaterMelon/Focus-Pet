import { describe, expect, it } from 'vitest'
import {
  CODE_PREFIX,
  CONTACT_IS_PLACEHOLDER,
  RESEARCH_CONTACT_EMAIL,
  CONSENT_CHECKS,
  CONSENT_SHEET,
  CONSENT_VERSION,
  generateParticipantId,
  isGeneratedId,
} from './consent'

// The participant code is the only link between what the app records and the
// paper questionnaires, and it is now issued rather than typed. What matters is
// that it comes out in a shape a person can copy by hand without ambiguity, and
// that it does not collide often enough to make the retry loop routine.

describe('generateParticipantId', () => {
  it('produces a code in the documented shape', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateParticipantId()
      expect(code).toMatch(/^FP-[A-Z0-9]{5}$/)
      expect(isGeneratedId(code)).toBe(true)
      expect(code.startsWith(`${CODE_PREFIX}-`)).toBe(true)
    }
  })

  it('never emits characters that are confusable on paper', () => {
    // Participants copy this onto a questionnaire by hand, so 1/I/L and 0/O
    // must not be able to appear at all.
    for (let i = 0; i < 500; i++) {
      expect(generateParticipantId()).not.toMatch(/[ILOU01]/)
    }
  })

  it('does not repeat itself across many draws', () => {
    // Not a uniqueness guarantee — that is the transactional claim's job — but
    // a generator that collided often would make the retry loop the norm.
    const codes = new Set(Array.from({ length: 2000 }, generateParticipantId))
    expect(codes.size).toBe(2000)
  })

  it('rejects codes that this app did not issue', () => {
    expect(isGeneratedId('P001')).toBe(false)
    expect(isGeneratedId('FP-ABC')).toBe(false)
    expect(isGeneratedId('FP-ILOU1')).toBe(false)
    expect(isGeneratedId('')).toBe(false)
  })
})

describe('research contact', () => {
  it('is a real address, not the placeholder', () => {
    // Shipping the consent sheet with no way to reach the team would leave
    // participants unable to ask questions or withdraw, which the sheet
    // promises they can. This fails the build rather than the study.
    expect(CONTACT_IS_PLACEHOLDER).toBe(false)
    expect(RESEARCH_CONTACT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  })
})

describe('consent sheet', () => {
  it('carries a version so revisions can be told apart', () => {
    expect(CONSENT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.v\d+$/)
  })

  it('covers every topic informed consent requires', () => {
    // If a section is dropped in a future edit, this fails rather than quietly
    // shipping a consent form that no longer explains withdrawal or data use.
    const headings = CONSENT_SHEET.map((s) => s.heading).join(' ')
    expect(headings).toContain('โครงงานวิจัยนี้คืออะไร')
    expect(headings).toContain('ต้องทำอะไรบ้าง')
    expect(headings).toContain('เก็บข้อมูลอะไร')
    expect(headings).toContain('ใครเห็นข้อมูล')
    expect(headings).toContain('ความเสี่ยง')
    expect(headings).toContain('สิทธิ์ของท่าน')
  })

  it('states the right to withdraw', () => {
    const body = CONSENT_SHEET.flatMap((s) => s.body).join(' ')
    expect(body).toContain('ถอนตัว')
    expect(body).toContain('สมัครใจ')
  })

  it('discloses the screen-time measurement limitation', () => {
    // Participants are consenting partly on the basis of what the app can and
    // cannot see. Hiding the browser limitation would make consent uninformed.
    const body = CONSENT_SHEET.flatMap((s) => s.body).join(' ')
    expect(body).toContain('เบราว์เซอร์ไม่สามารถอ่านเวลาการใช้งานหน้าจอ')
  })

  it('requires the participant to affirm three separate statements', () => {
    expect(CONSENT_CHECKS).toHaveLength(3)
    expect(CONSENT_CHECKS.every((c) => c.startsWith('ข้าพเจ้า'))).toBe(true)
  })
})
