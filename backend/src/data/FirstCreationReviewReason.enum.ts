/**
 * Why a first creation waits for a human. Not stored: the outcome is the event
 * (FIRST_CREATION_REVIEW) and the note on the thread; the reason goes to the log, where
 * whoever measures the review quota against its causes finds it.
 */
export enum FirstCreationReviewReason {
  SUSPICION = 'SUSPICION',
  MODEL_TIMEOUT = 'MODEL_TIMEOUT',
  MODEL_ERROR = 'MODEL_ERROR',
  /** Something other than the model broke after the process was claimed: filing, comment, confirm. */
  PROCESS_ERROR = 'PROCESS_ERROR',
  /** Ticks that cannot both be true of one person — decided by the rules, not by Crea. */
  CHECK_CONFLICT = 'CHECK_CONFLICT',
}
