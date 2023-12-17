import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'

import { KeyPair } from '@/data/KeyPair'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { KeyManager } from '@/manager/KeyManager'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { accountTypeToAddressType } from '@/utils/typeConverter'

import { AUF_ACCOUNT_DERIVATION_INDEX, GMW_ACCOUNT_DERIVATION_INDEX } from './const'
import { RegisterAddress } from './proto/3_3/RegisterAddress'

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
    account.balanceConfirmedAt = new Decimal(0)
    account.balanceCreatedAt = new Decimal(0)
    account.balanceCreatedAtDate = createdAt
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
    account.balanceCreatedAt = transaction.accountBalanceCreatedAt ?? new Decimal(0)
    account.balanceCreatedAtDate = transaction.createdAt
    account.balanceConfirmedAt = transaction.accountBalanceConfirmedAt ?? new Decimal(0)
    account.derivationIndex = registerAddress.derivationIndex ?? 1
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
