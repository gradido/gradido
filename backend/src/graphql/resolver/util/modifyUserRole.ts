import { User as DbUser, dbUpsertUserRole, UserRole } from 'database'

import { LogError } from '@/server/LogError'

// One upsert on the unique `user_id` (migration 0135) rather than "create one if the loaded
// relation is empty, then save it": two admins granting a role at the same moment both saw
// an empty relation, and the member got two rows. The in-memory `userRoles` is not updated
// here; the resolver reads the member back after the write.
export async function setUserRole(user: DbUser, role: string | null | undefined): Promise<void> {
  if (role) {
    await dbUpsertUserRole(user.id, role)
  }
}

// Note for group functions: the moderator's group scope lives on this row, so it
// goes with it. Granting the role again starts from an unset scope, which by the rule in
// describeModeratorCreationGroups means "sees every group" — a re-appointed moderator has to be
// given their groups again.
export async function deleteUserRole(user: DbUser): Promise<void> {
  if (user.userRoles.length > 0) {
    // remove all roles of the user
    await UserRole.delete({ userId: user.id })
    user.userRoles.length = 0
  } else if (user.userRoles.length === 0) {
    throw new LogError('User is already an usual user')
  }
}
