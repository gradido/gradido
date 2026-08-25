// AI-GENERATED — not an architecture reference

/**
 * The grace period of an assisted registration (EM-013): an account whose address was
 * never confirmed keeps full access for this long after it was created, and is then
 * narrowed down until the guest confirms (see RESTRICTED_WHILE_UNCONFIRMED).
 *
 * A constant, not a setting (rule E-020) — and deliberately gentle to get wrong: past
 * the deadline nothing is deleted and nothing expires, the account only waits.
 *
 * ⚠️ The wallet shows the same deadline in its reminder modal and derives it from
 * `user.createdAt` with its own 24h constant — change one, change both.
 */
export const CONFIRMATION_GRACE_PERIOD_HOURS = 24

/** The moment an account created at `accountCreatedAt` loses its unconfirmed grace. */
export const confirmationDeadline = (accountCreatedAt: Date): Date => {
  return new Date(
    new Date(accountCreatedAt).getTime() + CONFIRMATION_GRACE_PERIOD_HOURS * 60 * 60 * 1000,
  )
}

export const isConfirmationOverdue = (accountCreatedAt: Date, now: Date = new Date()): boolean => {
  return now.getTime() > confirmationDeadline(accountCreatedAt).getTime()
}
