// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { RoleNames } from '@enum/RoleNames'
import {
  ContributionMessage as DbContributionMessage,
  User as DbUser,
  dbGetFirstCreationSignerUserId,
  dbGetUserWithRolesById,
} from 'database'
import { DomainError, Result } from 'shared'
import { roleByName } from '@/auth/ROLES'
import { Role } from '@/auth/Role'
import { ContributionMessageArgs } from '@/graphql/arg/ContributionMessageArgs'
import { addModeratorMessageAs } from '@/graphql/resolver/util/addModeratorMessageAs'
import { confirmContributionAs } from '@/graphql/resolver/util/confirmContributionAs'
import { describeModeratorCreationGroups } from '@/graphql/resolver/util/moderatorCreationGroupScope'

// The signer (ES-005): the admin or moderator picked in the Crea settings who comments and
// confirms every first creation in their name — the managing director under the automatic
// letter. A role in the DCI sense: a plain user with the two actions the process needs.

export interface Signer {
  user: DbUser
  role: Role
}

export type SignerUnavailableReason =
  | 'NOT_CONFIGURED'
  | 'NOT_FOUND'
  | 'DELETED'
  | 'NOT_MODERATION'
  | 'SCOPED'
  | 'IS_MEMBER'

/**
 * Why nobody can sign right now. Every reason means "no window" for the member (soft off)
 * and a warning on the admin page.
 */
export class SignerUnavailable extends DomainError {
  constructor(
    public readonly reason: SignerUnavailableReason,
    /** The account that was looked at, when there was one - the admin page names it. */
    public readonly user: DbUser | null = null,
  ) {
    super(`FIRST_CREATION_SIGNER_UNAVAILABLE: ${reason}`)
  }
}

/**
 * Whether this account may sign at all: an admin, or a moderator WITHOUT a group scope.
 * A scoped moderator would fail on the first-creation contributions, which carry no group
 * (assertContributionInModeratorScope) — so they are refused here, up front, rather than
 * in the middle of a member's process. G §11 leaves the scoped case to a later decision.
 */
export function checkSignerAccount(user: DbUser): Result<Signer, SignerUnavailable> {
  if (user.deletedAt) {
    return { success: false, error: new SignerUnavailable('DELETED', user) }
  }
  const userRole = user.userRoles?.[0] ?? null
  const roleName = userRole?.role ?? null
  const isModeration =
    roleName === RoleNames.ADMIN ||
    roleName === RoleNames.MODERATOR ||
    roleName === RoleNames.MODERATOR_AI
  if (!isModeration) {
    return { success: false, error: new SignerUnavailable('NOT_MODERATION', user) }
  }
  const scope = describeModeratorCreationGroups(userRole)
  if (!scope.seesAllCreationGroups || !scope.seesUntagged) {
    return { success: false, error: new SignerUnavailable('SCOPED', user) }
  }
  return { success: true, value: { user, role: roleByName(roleName) } }
}

/** The account stored as signer, checked with checkSignerAccount. */
export async function resolveSigner(
  signerUserId: number,
): Promise<Result<Signer, SignerUnavailable>> {
  const found = await dbGetUserWithRolesById(signerUserId)
  if (!found.success) {
    return { success: false, error: new SignerUnavailable('NOT_FOUND') }
  }
  return checkSignerAccount(found.value)
}

/**
 * The signer for ONE member's process: the configured account, provided it is not the
 * member themselves — the booking path refuses a moderator confirming their own
 * contribution, so this is caught before anything is filed.
 */
export async function loadSignerFor(memberId: number): Promise<Result<Signer, SignerUnavailable>> {
  const signerUserId = await dbGetFirstCreationSignerUserId()
  if (signerUserId === null) {
    return { success: false, error: new SignerUnavailable('NOT_CONFIGURED') }
  }
  if (signerUserId === memberId) {
    return { success: false, error: new SignerUnavailable('IS_MEMBER') }
  }
  return resolveSigner(signerUserId)
}

/**
 * Writes onto the first contribution in the signer's name: DIALOG moves it to IN_PROGRESS
 * and mails the member (the one mail of the message, ES-009/ES-017), MODERATOR is the
 * internal note nobody is mailed about (ES-018).
 */
export async function signerComments(
  signer: Signer,
  contributionId: number,
  message: string,
  messageType: ContributionMessageType,
  clientTimezoneOffset: number,
): Promise<DbContributionMessage> {
  // A real instance, not a plain object: UpdateUnconfirmedContributionContext picks its
  // role with `instanceof` and would not recognise the shape otherwise.
  const args = Object.assign(new ContributionMessageArgs(), {
    contributionId,
    message,
    messageType,
  })
  return addModeratorMessageAs(args, signer.user, signer.role, clientTimezoneOffset)
}

/** Books one contribution in the signer's name — the existing confirmation path, whole. */
export async function signerConfirms(
  signer: Signer,
  contributionId: number,
  clientTimezoneOffset: number,
): Promise<void> {
  return confirmContributionAs(contributionId, signer.user, clientTimezoneOffset)
}
