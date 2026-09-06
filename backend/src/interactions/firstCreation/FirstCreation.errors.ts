// AI-GENERATED — not an architecture reference
import { DomainError } from 'shared'
import type { FirstCreationEntryInvalid } from '@/data/FirstCreation.logic'

// The expected failures of the first creation, as the resolver hands them to the client:
// codes, not sentences — the wallet knows the member's language, the backend does not.

export type FirstCreationNotEligibleReason =
  | 'NO_SIGNER'
  | 'NO_CATALOG'
  | 'ALREADY_STARTED'
  | 'HAS_MANUAL_CONTRIBUTION'

/** The window should not have been open for this member right now. */
export class FirstCreationNotEligible extends DomainError {
  constructor(public readonly reason: FirstCreationNotEligibleReason) {
    super(`FIRST_CREATION_NOT_ELIGIBLE: ${reason}`)
  }
}

/** A second Save while the first is still running (two tabs). */
export class FirstCreationAlreadyRunning extends DomainError {
  constructor() {
    super('FIRST_CREATION_ALREADY_RUNNING')
  }
}

/** The entries as sent cannot become contributions. */
export class FirstCreationEntriesInvalid extends DomainError {
  constructor(
    public readonly detail:
      | 'NO_ENTRIES'
      | 'TOO_MANY'
      | 'DUPLICATE_CHECK'
      | FirstCreationEntryInvalid,
  ) {
    super(`FIRST_CREATION_ENTRIES_INVALID: ${typeof detail === 'string' ? detail : detail.message}`)
  }
}

/** Less than 100 GDD free in the current month (ES-015 — ten test runs, then a new account). */
export class FirstCreationQuotaExceeded extends DomainError {
  constructor() {
    super('FIRST_CREATION_QUOTA_EXCEEDED')
  }
}

export type FirstCreationTestRefusedReason =
  /**
   * The caller is the account configured as signer. The booking path refuses a moderator
   * confirming their own contribution, and loadSignerFor turns that into "no signer" for
   * this member — which would leave the forced row standing with a window that never
   * opens. Refused here instead, where it can be said.
   */
  | 'IS_SIGNER'
  /**
   * No usable signer is configured at all. Forcing the row would still be written and the
   * window would still not open (isEligible asks for a signer too) — a press that changes
   * nothing anybody can see is worse than a refusal that says why.
   */
  | 'NO_SIGNER'
  /** FUNCTION_TESTS_ENABLED is off on this server. */
  | 'DISABLED'
  /** A first creation is running for this account right now. */
  | 'RUNNING'

/** The function test could not reopen the window (ES-014). */
export class FirstCreationTestRefused extends DomainError {
  constructor(public readonly reason: FirstCreationTestRefusedReason) {
    super(`FIRST_CREATION_TEST_REFUSED: ${reason}`)
  }
}

export type FirstCreationError =
  | FirstCreationNotEligible
  | FirstCreationAlreadyRunning
  | FirstCreationEntriesInvalid
  | FirstCreationQuotaExceeded
