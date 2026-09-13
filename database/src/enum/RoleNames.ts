export enum RoleNames {
  UNAUTHORIZED = 'UNAUTHORIZED',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  MODERATOR_AI = 'MODERATOR_AI',
  ADMIN = 'ADMIN',
  DLT_CONNECTOR = 'DLT_CONNECTOR_ROLE',
}

/**
 * The roles a `user_roles` row may hold: the ones that grant more than a usual member has.
 * A usual member has no row at all, so USER is not among them, and neither are the roles
 * that only ever exist on a request context (UNAUTHORIZED, DLT_CONNECTOR).
 *
 * ⛔ A row with USER is not harmless: every reader of `User.role` takes "has a role" for
 * "is part of the moderation" -- the wallet offered such members the admin link.
 * Migration 0136 removed the rows the old admin form had written that way.
 */
export const ASSIGNABLE_ROLE_NAMES: RoleNames[] = [
  RoleNames.ADMIN,
  RoleNames.MODERATOR,
  RoleNames.MODERATOR_AI,
]
