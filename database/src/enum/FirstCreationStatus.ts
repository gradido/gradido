// AI-GENERATED — not an architecture reference

/**
 * Where a member's first creation stands: `users.first_creation_status`, NULL for a member
 * who has not started. The column is the state of the PROCESS, not the history of the
 * window: skipping the window writes nothing here (it is an event), and the value only
 * ever moves forward -- except for the function test, which arms a new run (FORCED).
 *
 * HAS_CREATED is the member who found the regular path on their own: a contribution they
 * filed themselves (ES-011) shuts the window for good. It is written once, the first time
 * the question is asked, so that the answer never has to be counted out of `contributions`
 * again -- a member with a thousand bookings pays for that count exactly once.
 *
 * FORCED and FORCED_UNBOOKED are written by the function-test area (L4) to reopen the
 * window for an account that has long since created, with or without the booking (ES-016);
 * the next submit moves the member to SUBMITTED like a fresh start. IN_REVIEW is the safe
 * fallback of every fallback: suspicion, a model timeout, a model error and a crash between
 * filing and confirming all end there, in front of a human.
 *
 * ⛔ Append only. The column is a MySQL ENUM (like `account_state`), which stores the
 * position, not the text: reordering or removing a member rebuilds the whole table and moves
 * every row to a different state. A new state goes at the end, here and in a migration.
 */
export enum FirstCreationStatus {
  HAS_CREATED = 'HAS_CREATED',
  FORCED = 'FORCED',
  FORCED_UNBOOKED = 'FORCED_UNBOOKED',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  DONE_UNBOOKED = 'DONE_UNBOOKED',
}
