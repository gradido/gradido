import { KeyManager } from '@/manager/KeyManager'
import { KeyPair } from '@/data/KeyPair'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { Account } from '@entity/Account'
import Decimal from 'decimal.js-light'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import {
  accountTypeToAddressType,
  timestampSecondsToDate,
  timestampToDate,
} from '@/utils/typeConverter'
import { ConfirmedTransaction } from './proto/3_3/ConfirmedTransaction'
import { User } from '@entity/User'
import { LogError } from '@/server/LogError'
import { UserFactory } from './User.factory'
import { UserRepository } from './User.repository'

const GMW_ACCOUNT_DERIVATION_INDEX = 1
const AUF_ACCOUNT_DERIVATION_INDEX = 2

export class AccountFactory {
  public static create(
    createdAt: Date,
    derivationIndex: number,
    type: AddressType,
    parentKeyPair?: KeyPair,
  ): Account {
    const account = Account.create()
    account.derivationIndex = derivationIndex
    account.derive2Pubkey = KeyManager.getInstance().derive(
      [derivationIndex],
      parentKeyPair,
    ).publicKey
    account.type = type.valueOf()
    account.createdAt = createdAt
    account.balance = new Decimal(0)
    account.balanceCreatedAt = new Decimal(0)
    return account
  }

  public static createFromUserAccountDraft(
    { createdAt, accountType, user }: UserAccountDraft,
    parentKeyPair?: KeyPair,
  ): Account {
    return AccountFactory.create(
      new Date(createdAt),
      user.accountNr ?? 1,
      accountTypeToAddressType(accountType),
      parentKeyPair,
    )
  }

  public static async createFromProto(
    confirmedTransaction: ConfirmedTransaction,
  ): Promise<Account | User> {
    const body = confirmedTransaction.getTransactionBody()
    const registerAddress = body.registerAddress
    if (!registerAddress) {
      throw new LogError('wrong type of transaction, registerAddress expected')
    }
    const account = Account.create()
    let user: User | null = null
    if (registerAddress.userPubkey && registerAddress.userPubkey.length === 32) {
      if (registerAddress.addressType === AddressType.COMMUNITY_HUMAN) {
        user = UserFactory.createFromProto(confirmedTransaction)
      } else {
        user = await UserRepository.findByPublicKey(registerAddress.userPubkey)
      }
    }

    if (registerAddress.accountPubkey && registerAddress.accountPubkey.length === 32) {
      account.derive2Pubkey = Buffer.from(registerAddress.accountPubkey)
    }
    account.type = registerAddress.addressType.valueOf()
    account.createdAt = timestampToDate(body.createdAt)
    account.confirmedAt = timestampSecondsToDate(confirmedTransaction.confirmedAt)
    account.balance = new Decimal(confirmedTransaction.accountBalance)
    account.balanceDate = account.confirmedAt
    if (user) {
      account.user = user
    }
    return account
  }

  public static createGmwAccount(keyPair: KeyPair, createdAt: Date): Account {
    return AccountFactory.create(
      createdAt,
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
      AddressType.COMMUNITY_GMW,
      keyPair,
    )
  }

  public static createAufAccount(keyPair: KeyPair, createdAt: Date): Account {
    return AccountFactory.create(
      createdAt,
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
      AddressType.COMMUNITY_AUF,
      keyPair,
    )
  }
}
