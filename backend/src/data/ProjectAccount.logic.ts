// AI-GENERATED — not an architecture reference
import { DomainError } from 'shared'

// The project account (ES-021): the rules and the expected failures, as codes — the
// wallet and the admin know the reader's language, the backend does not.

/**
 * The one code every creation path answers a project account with: adminCreateContribution
 * for a moderator filing on its behalf, the contribution-link branch of redeeming for the
 * holder. The deny-list in isAuthorized answers with a bare 401 instead — that is the
 * right layer for "you may not call this at all", this one is for "not for THIS account".
 */
export const CREATION_NOT_ALLOWED = 'CREATION_NOT_ALLOWED'

/**
 * How often the holder of a project account may ask for the creation right back: one mail
 * to the support per day. A constant, not a setting (E-020); the request itself changes
 * nothing on the account, so the limit only guards the support's inbox.
 */
export const CREATION_RIGHT_REQUEST_INTERVAL_HOURS = 24

/** The moment a request made at `lastRequestAt` stops blocking the next one. */
export const nextCreationRightRequestAt = (lastRequestAt: Date): Date =>
  new Date(
    new Date(lastRequestAt).getTime() + CREATION_RIGHT_REQUEST_INTERVAL_HOURS * 60 * 60 * 1000,
  )

/** Whether a request now would come too soon after the last one (none = never too soon). */
export const isCreationRightRequestTooSoon = (
  lastRequestAt: Date | null,
  now: Date = new Date(),
): boolean => {
  if (!lastRequestAt) {
    return false
  }
  return now.getTime() < nextCreationRightRequestAt(lastRequestAt).getTime()
}

export type ProjectAccountRefusedReason =
  /** The moderation would be left with contributions of an account that may not create. */
  'OPEN_CONTRIBUTIONS'

/** Declaring the account a project account is refused. */
export class ProjectAccountRefused extends DomainError {
  constructor(public readonly reason: ProjectAccountRefusedReason) {
    super(`PROJECT_ACCOUNT_REFUSED: ${reason}`)
  }
}

export type CreationRightRequestRefusedReason =
  /** The account may create already — there is nothing to ask for. */
  | 'ALREADY_ALLOWED'
  /** A request went to the support less than a day ago. */
  | 'RATE_LIMITED'

/** Asking for the creation right back is refused. */
export class CreationRightRequestRefused extends DomainError {
  constructor(public readonly reason: CreationRightRequestRefusedReason) {
    super(`CREATION_RIGHT_REQUEST_REFUSED: ${reason}`)
  }
}
