import { User as DbUser } from 'database'
import { UserRole } from 'database'

import { LogError } from '@/server/LogError'

export async function setUserRole(user: DbUser, role: string | null | undefined): Promise<void> {
  // if role should be set
  if (role) {
    // in case user has still no associated userRole
    if (user.userRoles.length < 1) {
      // instanciate a userRole
      user.userRoles.push(UserRole.create())
    }
    // and initialize the userRole
    user.userRoles[0].role = role
    user.userRoles[0].userId = user.id
    await UserRole.save(user.userRoles[0])
  }
}

export async function deleteUserRole(user: DbUser): Promise<void> {
  if (user.userRoles.length > 0) {
    // remove all roles of the user
    await UserRole.delete({ userId: user.id })
    user.userRoles.length = 0
  } else if (user.userRoles.length === 0) {
    throw new LogError('User is already an usual user')
  }
}
