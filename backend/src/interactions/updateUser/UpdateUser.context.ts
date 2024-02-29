import { User } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'

import { AbstractUpdateUserRole } from './AbstractUpdateUser.role'
import { UpdateUserAliasRole } from './UpdateUserAlias.role'
import { UpdateUserGenericFieldsRole } from './UpdateUserGenericFields.role'
import { UpdateUserLanguageRole } from './UpdateUserLanguage.role'
import { UpdateUserLocationRole } from './UpdateUserLocation.role'
import { UpdateUserPasswordRole } from './UpdateUserPassword.role'

export class UpdateUserContext {
  private user: User
  public constructor(private updateUserInfos: UpdateUserInfosArgs, private context: Context) {
    if (!context.user) {
      throw new LogError('No user given in context')
    }
    this.user = context.user
  }

  /**
   * @returns changed user, is the same as context.user
   */
  public async run(): Promise<User> {
    const updateUserRoles: AbstractUpdateUserRole[] = []
    if (this.updateUserInfos.alias) {
      updateUserRoles.push(new UpdateUserAliasRole())
    }
    if (this.updateUserInfos.language) {
      updateUserRoles.push(new UpdateUserLanguageRole())
    }
    if (this.updateUserInfos.password && this.updateUserInfos.passwordNew) {
      updateUserRoles.push(new UpdateUserPasswordRole())
    }
    if (this.updateUserInfos.gmsLocation) {
      updateUserRoles.push(new UpdateUserLocationRole())
    }
    updateUserRoles.push(new UpdateUserGenericFieldsRole())
    for (const role of updateUserRoles) {
      await role.update(this.user, this.updateUserInfos)
    }
    return this.user
  }
}
