import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'

import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { LogError } from '@/server/LogError'
import { timestampSecondsToDate, timestampToDate } from '@/utils/typeConverter'

import { KeyPair } from './KeyPair'
import { ConfirmedTransaction } from './proto/3_3/ConfirmedTransaction'
import { RegisterAddress } from './proto/3_3/RegisterAddress'
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

  static createFromProto(confirmedTransaction: ConfirmedTransaction): User {
    const body = confirmedTransaction.getTransactionBody()
    const registerAddress = body.registerAddress
    if (!registerAddress) {
      throw new LogError('wrong type of transaction, registerAddress expected')
    }
    const user = User.create()
    user.createdAt = timestampToDate(body.createdAt)
    user.derive1Pubkey = Buffer.from(registerAddress.userPubkey)
    user.confirmedAt = timestampSecondsToDate(confirmedTransaction.confirmedAt)
    return user
  }

  static createFromTransaction(transaction: Transaction, registerAddress: RegisterAddress): User {
    const user = User.create()
    user.createdAt = transaction.createdAt
    user.derive1Pubkey = Buffer.from(registerAddress.userPubkey)
    user.confirmedAt = transaction.confirmedAt
    return user
  }
}
