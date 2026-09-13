import { User as DbUser, dbRemoveUserRoles, dbUpsertUserRole } from 'database'

import { LogError } from '@/server/LogError'

// One upsert on the unique `user_id` (migration 0135) rather than "create one if the loaded
// relation is empty, then save it": two admins granting a role at the same moment both saw
// an empty relation, and the member got two rows. Answers the member's role after the call,
// so the resolver does not have to read the member back.
export async function setUserRole(
  user: DbUser,
  role: string | null | undefined,
): Promise<string | null> {
  if (!role) {
    return user.userRole?.role ?? null
  }
  await dbUpsertUserRole(user.id, role)
  return role
}

// Note for group functions: the moderator's group scope lives on this row, so it
// goes with it. Granting the role again starts from an unset scope, which by the rule in
// describeModeratorCreationGroups means "sees every group" — a re-appointed moderator has to be
// given their groups again.
export async function deleteUserRole(user: DbUser): Promise<void> {
  if (!user.userRole) {
    throw new LogError('User is already an usual user')
  }
  await dbRemoveUserRoles([user.id])
  user.userRole = null
}
