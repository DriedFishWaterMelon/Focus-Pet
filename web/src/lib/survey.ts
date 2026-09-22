// The study questionnaire, hosted on Google Forms.
//
// Participants answer SAS-SV, PSQI and the satisfaction items in a Form rather
// than in the app, so the two datasets have to be joined afterwards on the
// participant code. The app opens the Form with that code already filled in,
// which removes the only step where the join could break: a person typing their
// own code by hand.
//
// Deliberately not matched by email. The consent sheet promises the analysis
// set contains no email addresses, and anonymous sign-ins have none at all.

/** The form created by scripts/create-google-form.gs. */
export const SURVEY_FORM_ID = '1FAIpQLScI0bdP-7T1BJbvjPP0v5I8Yp2y20L6uGjEjvH_N3O_zlxTlw'

/**
 * The field id of the participant-code question, taken from the form's
 * "Get pre-filled link" URL. It changes if that question is deleted and
 * re-created, so it lives here as a named constant rather than inline.
 */
export const SURVEY_CODE_ENTRY = 'entry.1049877445'

export const SURVEY_BASE_URL = `https://docs.google.com/forms/d/e/${SURVEY_FORM_ID}/viewform`

/**
 * Builds the questionnaire link for a participant.
 *
 * Returns null without a code: sending someone to the form with the field blank
 * invites them to invent an answer, and a response that cannot be joined is
 * worse than a missing one because it looks like data.
 */
export function surveyUrlFor(participantId: string): string | null {
  const code = participantId.trim()
  if (!code) return null

  const params = new URLSearchParams({
    usp: 'pp_url',
    [SURVEY_CODE_ENTRY]: code,
  })
  return `${SURVEY_BASE_URL}?${params.toString()}`
}
