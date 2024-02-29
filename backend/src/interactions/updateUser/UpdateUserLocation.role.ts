import { User } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'
import { Location2Point } from '@/graphql/resolver/util/Location2Point'

import { AbstractUpdateUserRole } from './AbstractUpdateUser.role'

export class UpdateUserLocationRole extends AbstractUpdateUserRole {
  public update(user: User, { gmsLocation }: UpdateUserInfosArgs): Promise<void> {
    if (gmsLocation) {
      user.location = Location2Point(gmsLocation)
    }
    return Promise.resolve()
  }
}
