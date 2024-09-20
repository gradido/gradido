/* eslint-disable camelcase */
import { Account } from '@entity/Account'
import Decimal from 'decimal.js-light'
import {
  AddressType,
  AddressType_COMMUNITY_AUF,
  AddressType_COMMUNITY_GMW,
} from 'gradido-blockchain-js'

import { KeyPair } from '@/data/KeyPair'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { accountTypeToAddressType } from '@/utils/typeConverter'

const GMW_ACCOUNT_DERIVATION_INDEX = 1
const AUF_ACCOUNT_DERIVATION_INDEX = 2

export class AccountFactory {
  public static createAccount(
    createdAt: Date,
    derivationIndex: number,
    type: AddressType,
    parentKeyPair: KeyPair,
  ): Account {
    const account = Account.create()
    account.derivationIndex = derivationIndex
    account.derive2Pubkey = parentKeyPair.derive([derivationIndex]).publicKey
    account.type = type.valueOf()
    account.createdAt = createdAt
    account.balanceOnConfirmation = new Decimal(0)
    account.balanceOnCreation = new Decimal(0)
    account.balanceCreatedAt = createdAt
    return account
  }

  public static createAccountFromUserAccountDraft(
    { createdAt, accountType, user }: UserAccountDraft,
    parentKeyPair: KeyPair,
  ): Account {
    return AccountFactory.createAccount(
      new Date(createdAt),
      user.accountNr ?? 1,
      accountTypeToAddressType(accountType),
      parentKeyPair,
    )
  }

  public static createGmwAccount(keyPair: KeyPair, createdAt: Date): Account {
    return AccountFactory.createAccount(
      createdAt,
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
      AddressType_COMMUNITY_GMW,
      keyPair,
    )
  }

  public static createAufAccount(keyPair: KeyPair, createdAt: Date): Account {
    return AccountFactory.createAccount(
      createdAt,
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
      AddressType_COMMUNITY_AUF,
      keyPair,
    )
  }
}
