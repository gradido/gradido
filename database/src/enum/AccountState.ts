// AI-GENERATED — not an architecture reference
/**
 * Where an account stands, as one value (`users.account_state`, migration 0148).
 *
 * ⛔ Append only. The order of the members is the order of the MySQL ENUM, which stores the
 * position, not the text: reordering or removing a member rebuilds the whole table and moves
 * every row to a different state. A new state goes at the end, here and in a migration.
 *
 * TODO: most readers still decide from `deleted_at`, `email_checked` and `foreign` - see the
 * issue "Complete refactor for account state". Until then every write of those fields has to
 * keep this column in step.
 */
export enum AccountState {
  // Signed up, email not confirmed yet.
  REGISTERED = 'REGISTERED',
  // Opened with a password because a member vouches for it - at a table with their guarantor
  // code, or while accepting the thank-you of their redeem link: may act before the email is
  // confirmed, and counts against the guarantor's GUARANTOR_LIMIT until it is.
  PARTLY_ACTIVATED_GUARANTOR = 'PARTLY_ACTIVATED_GUARANTOR',
  // Email confirmed.
  ACTIVATED = 'ACTIVATED',
  // Soft deleted (`deleted_at` set).
  DELETED = 'DELETED',
  // A member of another community, known here only as a copy.
  FOREIGN = 'FOREIGN',
}
