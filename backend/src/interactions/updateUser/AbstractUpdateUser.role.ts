import { User } from '@entity/User'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'

export abstract class AbstractUpdateUserRole {
  // throw on error
  public abstract update(user: User, updateUserInfos: UpdateUserInfosArgs): Promise<void>
}
