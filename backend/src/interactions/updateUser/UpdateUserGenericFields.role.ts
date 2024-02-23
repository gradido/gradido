import { User } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'

import { AbstractUpdateUserRole } from './AbstractUpdateUser.role'

export class UpdateUserGenericFieldsRole extends AbstractUpdateUserRole {
  public update(user: User, updateUserInfos: UpdateUserInfosArgs): Promise<void> {
    /*
      Nullish Coalescing ??
      Source: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing
      use left side only if it isn't set to null or undefined, else use right site the current value
      */
    user.firstName = updateUserInfos.firstName ?? user.firstName
    user.lastName = updateUserInfos.lastName ?? user.lastName
    user.publisherId = updateUserInfos.publisherId ?? user.publisherId
    user.hideAmountGDD = updateUserInfos.hideAmountGDD ?? user.hideAmountGDD
    user.hideAmountGDT = updateUserInfos.hideAmountGDT ?? user.hideAmountGDT
    user.gmsAllowed = updateUserInfos.gmsAllowed ?? user.gmsAllowed
    user.gmsPublishName = updateUserInfos.gmsPublishName ?? user.gmsPublishName
    user.gmsPublishLocation = updateUserInfos.gmsPublishLocation ?? user.gmsPublishLocation
    return Promise.resolve()
  }
}
