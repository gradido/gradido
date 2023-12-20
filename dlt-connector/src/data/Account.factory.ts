import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'

import { KeyPair } from '@/data/KeyPair'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { accountTypeToAddressType } from '@/utils/typeConverter'

import { AUF_ACCOUNT_DERIVATION_INDEX, GMW_ACCOUNT_DERIVATION_INDEX } from './const'
import { RegisterAddress } from './proto/3_3/RegisterAddress'

export class AccountFactory {
  public static create(
    createdAt: Date,
    derivationIndex: number,
    type: AddressType,
    userKeyPair: KeyPair,
  ): Account {
    const account = Account.create()
    account.derivationIndex = derivationIndex
    account.derive2Pubkey = userKeyPair.derive([derivationIndex]).publicKey
    account.type = type.valueOf()
    account.createdAt = createdAt
    account.balanceOnConfirmation = new Decimal(0)
    account.balanceOnCreation = new Decimal(0)
    account.balanceCreatedAt = createdAt
    return account
  }

  public static createFromUserAccountDraft(
    { createdAt, accountType, user }: UserAccountDraft,
    userKeyPair: KeyPair,
  ): Account {
    return AccountFactory.create(
      new Date(createdAt),
      user.accountNr ?? 1,
      accountTypeToAddressType(accountType),
      userKeyPair,
    )
  }

  public static createFromTransaction(
    transaction: Transaction,
    registerAddress: RegisterAddress,
  ): Account {
    const account = Account.create()
    if (registerAddress.accountPubkey && registerAddress.accountPubkey.length === 32) {
      account.derive2Pubkey = Buffer.from(registerAddress.accountPubkey)
    }
    account.type = registerAddress.addressType.valueOf()
    account.createdAt = transaction.createdAt
    account.confirmedAt = transaction.confirmedAt
    account.balanceOnCreation = transaction.accountBalanceOnCreation ?? new Decimal(0)
    account.balanceCreatedAt = transaction.createdAt
    account.balanceOnConfirmation = transaction.accountBalanceOnConfirmation ?? new Decimal(0)
    account.derivationIndex = registerAddress.derivationIndex ?? 1
    return account
  }

  public static createGmwAccount(communityKeyPair: KeyPair, createdAt: Date): Account {
    return AccountFactory.create(
      createdAt,
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
      AddressType.COMMUNITY_GMW,
      communityKeyPair,
    )
  }

  public static createAufAccount(communityKeyPair: KeyPair, createdAt: Date): Account {
    return AccountFactory.create(
      createdAt,
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
      AddressType.COMMUNITY_AUF,
      communityKeyPair,
    )
  }
}
