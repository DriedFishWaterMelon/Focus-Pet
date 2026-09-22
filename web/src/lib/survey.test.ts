import { describe, expect, it } from 'vitest'
import { SURVEY_CODE_ENTRY, SURVEY_FORM_ID, surveyUrlFor } from './survey'
import { generateParticipantId } from './consent'

// The prefilled link is the only thing standing between a participant and
// typing their own code into the questionnaire, which is where the join
// between the app's data and the survey answers would break.

describe('surveyUrlFor', () => {
  it('builds a prefilled link for a code', () => {
    const url = surveyUrlFor('FP-K7M2N')
    expect(url).toContain(SURVEY_FORM_ID)
    expect(url).toContain(`${SURVEY_CODE_ENTRY}=FP-K7M2N`)
    expect(url).toContain('usp=pp_url')
  })

  it('refuses to build a link without a code', () => {
    // A form opened with the field blank invites someone to invent an answer,
    // and an unjoinable response is worse than a missing one: it looks like data.
    expect(surveyUrlFor('')).toBeNull()
    expect(surveyUrlFor('   ')).toBeNull()
  })

  it('carries every code the app can issue, unmangled', () => {
    for (let i = 0; i < 500; i++) {
      const code = generateParticipantId()
      const url = surveyUrlFor(code)
      expect(url).toContain(`${SURVEY_CODE_ENTRY}=${code}`)
      // The hyphen must survive URL encoding, or the form's validation rejects it.
      expect(url).not.toContain('%2D')
    }
  })

  it('produces a URL the browser will accept', () => {
    const url = new URL(surveyUrlFor('FP-K7M2N') as string)
    expect(url.protocol).toBe('https:')
    expect(url.hostname).toBe('docs.google.com')
    expect(url.searchParams.get(SURVEY_CODE_ENTRY)).toBe('FP-K7M2N')
  })

  it('trims stray whitespace rather than sending it to the form', () => {
    expect(surveyUrlFor('  FP-K7M2N  ')).toContain(`${SURVEY_CODE_ENTRY}=FP-K7M2N`)
  })
})
