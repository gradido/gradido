// AI-GENERATED — not an architecture reference

/**
 * Where a member's first creation stands. The row is the state of the PROCESS, not the
 * history of the window: skipping the window writes no row (it is an event), and a row
 * only ever moves forward.
 *
 * FORCED is written by the function-test area (L4) to reopen the window for an account
 * that has long since created; the next submit moves it to SUBMITTED like a fresh row.
 * IN_REVIEW is the safe fallback of every fallback: suspicion, a model timeout, a model
 * error and a crash between filing and confirming all end there, in front of a human.
 */
export enum FirstCreationStatus {
  FORCED = 'FORCED',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  DONE_UNBOOKED = 'DONE_UNBOOKED',
}

/**
 * Why a first creation waits for a human — kept for the review quota measurement.
 *
 * ⚠️ `first_creations.review_reason` is `varchar(16)`: every value here has to fit, and
 * `firstCreations.test.ts` measures that rather than trusting it. `CHECK_CONFLICT` is short
 * for exactly that reason — `CONTRADICTORY_CHECKS` would have been four characters too long.
 */
export enum FirstCreationReviewReason {
  SUSPICION = 'SUSPICION',
  MODEL_TIMEOUT = 'MODEL_TIMEOUT',
  MODEL_ERROR = 'MODEL_ERROR',
  /** Something other than the model broke after the row was claimed: filing, comment, confirm. */
  PROCESS_ERROR = 'PROCESS_ERROR',
  /** Ticks that cannot both be true of one person — decided by the rules, not by Crea. */
  CHECK_CONFLICT = 'CHECK_CONFLICT',
}

/** A function-test run (L4); null on the row means a real run. */
export enum FirstCreationTestMode {
  WITH_BOOKING = 'WITH_BOOKING',
  WITHOUT_BOOKING = 'WITHOUT_BOOKING',
}
