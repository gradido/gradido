import { KeyManager } from '@/controller/KeyManager'
import { KeyPair } from '@/model/KeyPair'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import { Account } from '@entity/Account'
import Decimal from 'decimal.js-light'

const GMW_ACCOUNT_DERIVATION_INDEX = 1
const AUF_ACCOUNT_DERIVATION_INDEX = 2

export const createAccount = (
  keyPair: KeyPair,
  createdAt: Date,
  derivationIndex: number,
  type: AddressType,
): Account => {
  const account = Account.create()
  account.derivationIndex = derivationIndex
  account.derive2Pubkey = KeyManager.getInstance().derive([derivationIndex], keyPair).publicKey
  account.type = type.valueOf()
  account.createdAt = createdAt
  account.balance = new Decimal(0)
  return account
}

export const createGmwAccount = (keyPair: KeyPair, createdAt: Date): Account => {
  return createAccount(
    keyPair,
    createdAt,
    hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
    AddressType.COMMUNITY_GMW,
  )
}

export const createAufAccount = (keyPair: KeyPair, createdAt: Date): Account => {
  return createAccount(
    keyPair,
    createdAt,
    hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
    AddressType.COMMUNITY_AUF,
  )
}
