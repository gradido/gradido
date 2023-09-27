import { AddressType } from '@/proto/3_3/enum/AddressType'
import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { KeyManager } from './KeyManager'
import { LogError } from '@/server/LogError'
import { KeyPair } from '../model/KeyPair'
import { getKeyPair as getUserKeyPair } from './User'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import Decimal from 'decimal.js-light'
import { In } from '@dbTools/typeorm'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { User } from '@entity/User'

const GMW_ACCOUNT_DERIVATION_INDEX = 1
const AUF_ACCOUNT_DERIVATION_INDEX = 2

export const create = (
  derivationIndex: number,
  derive2Pubkey: Buffer,
  type: AddressType,
  createdAt: Date,
): Account => {
  if (derive2Pubkey.length !== 32) {
    throw new LogError('invalid public key size')
  }
  const account = Account.create()
  account.derivationIndex = derivationIndex
  account.derive2Pubkey = derive2Pubkey
  account.type = type.valueOf()
  account.createdAt = createdAt
  account.balance = new Decimal(0)
  return account
}

export const findAccountsByPublicKeys = (publicKeys: Buffer[]): Promise<Account[]> => {
  return Account.findBy({ derive2Pubkey: In(publicKeys) })
}

export const findAccountByPublicKey = async (
  publicKey: Buffer | undefined,
): Promise<Account | undefined> => {
  if (!publicKey) return undefined
  return (await Account.findOneBy({ derive2Pubkey: publicKey })) ?? undefined
}

export const createCommunitySpecialAccounts = (community: Community): void => {
  const km = KeyManager.getInstance()

  // create account for gmw account
  const gmwDerivationIndex = hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX)
  community.gmwAccount = create(
    gmwDerivationIndex,
    km.derive([gmwDerivationIndex]).publicKey,
    AddressType.COMMUNITY_GMW,
    community.createdAt,
  )

  // create account for auf account
  const aufDerivationIndex = hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX)
  community.aufAccount = create(
    aufDerivationIndex,
    km.derive([aufDerivationIndex]).publicKey,
    AddressType.COMMUNITY_AUF,
    community.createdAt,
  )
}

export const findAccountByUserIdentifier = async ({
  uuid,
  accountNr,
}: UserIdentifier): Promise<Account | undefined> => {
  const account = await User.findOne({
    where: { gradidoID: uuid, accounts: { derivationIndex: accountNr ?? 1 } },
    relations: ['accounts'],
  })
  return account?.accounts?.[0]
}

export const getKeyPair = (account: Account): KeyPair | null => {
  const km = KeyManager.getInstance()
  switch (account.type) {
    case AddressType.NONE:
      return null
    case AddressType.COMMUNITY_HUMAN:
    case AddressType.COMMUNITY_PROJECT:
    case AddressType.SUBACCOUNT:
      if (!account.user) {
        throw new LogError('no user for account')
      }
      return km.derive([account.derivationIndex], getUserKeyPair(account.user))
    case AddressType.COMMUNITY_GMW:
      return km.derive([hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX)])
    case AddressType.COMMUNITY_AUF:
      return km.derive([hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX)])
    default:
      return null
  }
}
