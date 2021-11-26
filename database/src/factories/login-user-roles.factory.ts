import Faker from 'faker'
import { define } from 'typeorm-seeding'
import { LoginUserRoles } from '../../entity/LoginUserRoles'

interface LoginUserRolesContext {
  userId?: number
  roleId?: number
}

define(LoginUserRoles, (faker: typeof Faker, context?: LoginUserRolesContext) => {
  if (!context) context = {}
  if (!context.userId) throw new Error('LoginUserRoles: No userId present!')
  if (!context.roleId) throw new Error('LoginUserRoles: No roleId present!')

  const userRoles = new LoginUserRoles()
  userRoles.userId = context.userId
  userRoles.roleId = context.roleId

  return userRoles
})
