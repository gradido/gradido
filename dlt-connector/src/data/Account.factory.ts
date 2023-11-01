import { KeyManager } from '@/manager/KeyManager'
import { KeyPair } from '@/data/KeyPair'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { Account } from '@entity/Account'
import Decimal from 'decimal.js-light'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { accountTypeToAddressType } from '@/utils/typeConverter'

const GMW_ACCOUNT_DERIVATION_INDEX = 1
const AUF_ACCOUNT_DERIVATION_INDEX = 2

export class AccountFactory {
  public static createAccount(
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

  public static createAccountFromUserAccountDraft(
    { createdAt, accountType, user }: UserAccountDraft,
    parentKeyPair?: KeyPair,
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
      AddressType.COMMUNITY_GMW,
      keyPair,
    )
  }

  public static createAufAccount(keyPair: KeyPair, createdAt: Date): Account {
    return AccountFactory.createAccount(
      createdAt,
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
      AddressType.COMMUNITY_AUF,
      keyPair,
    )
  }
}
