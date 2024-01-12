import { User } from '@entity/User'

import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'

import { KeyPair } from './KeyPair'
import { UserLogic } from './User.logic'

export class UserFactory {
  static create(userAccountDraft: UserAccountDraft, parentKeys: KeyPair): User {
    const user = User.create()
    user.createdAt = new Date(userAccountDraft.createdAt)
    user.gradidoID = userAccountDraft.user.uuid
    const userLogic = new UserLogic(user)
    // store generated pubkey into entity
    userLogic.calculateKeyPair(parentKeys)
    return user
  }
}
