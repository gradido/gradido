// Deterministic layer 3 for Crea (design docs `G` ch. 5-6, decisions E-009 / E-012).
//
// Division of labour: Crea does the semantic extraction (which activities, how
// many hours each); the CODE owns the hard money/time arithmetic and carries
// the authoritative discrepancy flag. Kept pure and side-effect-free so it is
// unit-testable without the Anthropic API.

import { guessGender } from './nameGender'

// Gradido time-value calibration: 1 hour = 20 GDD; monthly cap 50 h / 1000 GDD.
export const GDD_PER_HOUR = 20
export const MONTHLY_CAP_HOURS = 50
export const MONTHLY_CAP_GDD = MONTHLY_CAP_HOURS * GDD_PER_HOUR // 1000

// A discrepancy only fires on a clear deviation, not on rounding or an even
// split of the total across activities. "≈ entered" = within
// max(1 hour, 15% of entered).
const DISCREPANCY_ABS_TOLERANCE_HOURS = 1
const DISCREPANCY_REL_TOLERANCE = 0.15

// Member statuses that must never trigger an hours inquiry (G ch. 5 / ch. 7,
// E-012). Matched as a substring, case-insensitive, in either language, because
// the status is free text sourced from the contribution/history, not an enum.
const NO_HOURS_INQUIRY_STATUSES = ['rentner', 'retiree', 'kind', 'child']

export type Discrepancy = 'none' | 'text_below_entered' | 'text_above_entered'

type EnteredAmounts = { enteredHours?: number | null; enteredGdd?: number | null }

/** The entered hours, derived from the GDD amount when only that is supplied. */
export function resolveEnteredHours(input: EnteredAmounts): number | null {
  if (input.enteredHours != null) {
    return input.enteredHours
  }
  if (input.enteredGdd != null) {
    return input.enteredGdd / GDD_PER_HOUR
  }
  return null
}

/** The entered GDD amount, derived from the hours when only those are supplied. */
export function resolveEnteredGdd(input: EnteredAmounts): number | null {
  if (input.enteredGdd != null) {
    return input.enteredGdd
  }
  if (input.enteredHours != null) {
    return input.enteredHours * GDD_PER_HOUR
  }
  return null
}

/** Whether the monthly total has reached the cap. Pure info — never a discrepancy trigger. */
export function isCapReached(monthlyHours?: number | null): boolean {
  return monthlyHours != null && monthlyHours >= MONTHLY_CAP_HOURS
}

export type SalutationResult = { salutation: string; uncertain: boolean }

// The placeholder Crea emits in its response text; the code replaces it locally
// with the real salutation so the recipient's name never reaches the API.
export const SALUTATION_PLACEHOLDER = '[ANREDE]'

// The signature placeholder Crea closes with; the code replaces it locally with
// the moderator's own greeting so the moderator's name never reaches the API (E-013).
export const SIGNATURE_PLACEHOLDER = '[SIGNATUR]'

/**
 * Builds the salutation locally from the recipient's first name (E-012 — PII
 * stays local). Grammatical gender comes from the name heuristic; an unknown
 * name or unknown gender keeps a neutral form and returns `uncertain: true` so
 * the UI flags it for the moderator (E-005). An explicit `override` (e.g. a
 * salutation the moderator already set) always wins.
 */
export function buildSalutation(
  firstName?: string | null,
  override?: string | null,
): SalutationResult {
  if (override?.trim()) {
    return { salutation: override.trim(), uncertain: false }
  }
  const name = firstName?.trim()
  if (!name) {
    return { salutation: 'Hallo', uncertain: true }
  }
  const gender = guessGender(name)
  if (gender === 'male') {
    return { salutation: `Lieber ${name}`, uncertain: false }
  }
  if (gender === 'female') {
    return { salutation: `Liebe ${name}`, uncertain: false }
  }
  // Name known, gender not: keep the name, default to the neutral "Hallo", flag
  // for review — never a risky "Liebe/Lieber" guess (E-014).
  return { salutation: `Hallo ${name}`, uncertain: true }
}

function isNoHoursInquiryStatus(memberStatus?: string | null): boolean {
  if (!memberStatus) {
    return false
  }
  const status = memberStatus.trim().toLowerCase()
  return NO_HOURS_INQUIRY_STATUSES.some((key) => status.includes(key))
}

/** Sum of the hours Crea attributed to the individual activities (null if none). */
export function sumActivityHours(evaluation: {
  activities?: ReadonlyArray<{ hours: number }> | null
}): number | null {
  if (!evaluation.activities?.length) {
    return null
  }
  return evaluation.activities.reduce(
    (sum, activity) => sum + (Number.isFinite(activity.hours) ? activity.hours : 0),
    0,
  )
}

/**
 * Authoritative, direction-aware discrepancy between the hours Crea extracted
 * from the text and the hours entered for this contribution (E-012).
 * `none` when either figure is missing, the two are within tolerance, or the
 * member status forbids an hours inquiry.
 * - text mentions MORE than entered  -> text_above_entered (appreciate; covers correct capping)
 * - text mentions FEWER than entered -> text_below_entered (inquiry) unless status forbids it
 */
export function computeDiscrepancy(
  extractedHours: number | null,
  enteredHours: number | null,
  memberStatus?: string | null,
): Discrepancy {
  if (extractedHours == null || enteredHours == null || enteredHours <= 0) {
    return 'none'
  }
  const tolerance = Math.max(
    DISCREPANCY_ABS_TOLERANCE_HOURS,
    enteredHours * DISCREPANCY_REL_TOLERANCE,
  )
  const delta = extractedHours - enteredHours
  if (Math.abs(delta) <= tolerance) {
    return 'none'
  }
  if (delta > 0) {
    return 'text_above_entered'
  }
  return isNoHoursInquiryStatus(memberStatus) ? 'none' : 'text_below_entered'
}
