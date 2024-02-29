import { User } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { validateAlias } from '@/graphql/resolver/util/validateAlias'

import { AbstractUpdateUserRole } from './AbstractUpdateUser.role'

export class UpdateUserAliasRole extends AbstractUpdateUserRole {
  public async update(user: User, { alias }: UpdateUserInfosArgs): Promise<void> {
    if (alias && (await validateAlias(alias))) {
      user.alias = alias
    }
  }
}
