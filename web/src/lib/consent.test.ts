import { describe, expect, it } from 'vitest'
import { CONSENT_CHECKS, CONSENT_SHEET, CONSENT_VERSION, validateParticipantId } from './consent'

// The participant code is the only link between what the app records and the
// paper questionnaires. A code that normalises inconsistently splits one
// person's data across several records, and nobody notices until analysis.

describe('validateParticipantId', () => {
  it('accepts a well-formed code', () => {
    expect(validateParticipantId('P001')).toEqual({ ok: true, value: 'P001' })
  })

  it('normalises case and surrounding whitespace', () => {
    expect(validateParticipantId('  p001 ').value).toBe('P001')
  })

  it('normalises Thai digits', () => {
    // Thai keyboards produce these, and a participant copying from a paper slip
    // may well type them. Left alone, P๐๐๑ and P001 become two participants.
    expect(validateParticipantId('P๐๐๑').value).toBe('P001')
    expect(validateParticipantId('๑๒๓').value).toBe('123')
  })

  it('normalises inner spaces and underscores to a hyphen', () => {
    expect(validateParticipantId('G8 001').value).toBe('G8-001')
    expect(validateParticipantId('G8_001').value).toBe('G8-001')
  })

  it('treats the normalised forms of one code as identical', () => {
    const forms = ['P001', 'p001', ' P001 ', 'P๐๐๑']
    const normalised = new Set(forms.map((f) => validateParticipantId(f).value))
    expect(normalised.size).toBe(1)
  })

  it('rejects an empty code', () => {
    expect(validateParticipantId('').ok).toBe(false)
    expect(validateParticipantId('   ').ok).toBe(false)
  })

  it('rejects a code with no digits', () => {
    // Guards against someone typing their name into the field.
    expect(validateParticipantId('SOMCHAI').ok).toBe(false)
  })

  it('rejects Thai letters and punctuation', () => {
    expect(validateParticipantId('รหัส1').ok).toBe(false)
    expect(validateParticipantId('P001!').ok).toBe(false)
    expect(validateParticipantId('P@01').ok).toBe(false)
  })

  it('rejects codes outside the length limits', () => {
    expect(validateParticipantId('1').ok).toBe(false)
    expect(validateParticipantId('P0000000000000001').ok).toBe(false)
  })

  it('accepts hyphenated team formats', () => {
    expect(validateParticipantId('g8-001').value).toBe('G8-001')
  })

  it('never returns a value when it rejects', () => {
    for (const bad of ['', 'ABC', 'รหัส', 'P@1', '1']) {
      expect(validateParticipantId(bad).value).toBe('')
    }
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
