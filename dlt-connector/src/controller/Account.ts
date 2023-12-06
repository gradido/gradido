import { In } from '@dbTools/typeorm'
import { Account } from '@entity/Account'
import { Community } from '@entity/Community'


import { User } from '@entity/User'
import Decimal from 'decimal.js-light'

import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { getBody } from './GradidoTransaction'

import { RegisterAddress } from '@/data/proto/3_3/RegisterAddress'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'
import { getDataSource } from '@/typeorm/DataSource'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import {accountTypeToAddressType} from '@/utils/typeConverter'

import { KeyPair } from '../model/KeyPair'

import { KeyManager } from './KeyManager'
import {getKeyPair as getUserKeyPair} from './User'

const GMW_ACCOUNT_DERIVATION_INDEX = 1
const AUF_ACCOUNT_DERIVATION_INDEX = 2

export const createFromUserAccountDraft = (
  userAccountDraft: UserAccountDraft,
  user: User,
): Account => {
  const account = Account.create()
  account.derivationIndex = userAccountDraft.user.accountNr ?? 1
  account.type = accountTypeToAddressType(userAccountDraft.accountType)
  account.user = user
  account.createdAt = new Date(userAccountDraft.createdAt)
  const keyPair = getKeyPair(account)
  if (!keyPair) {
    throw new LogError('Error deriving key pair')
  }
  account.derive2Pubkey = keyPair.publicKey
  account.balance = new Decimal(0)
  return account
}


export const findAccountByPublicKey = async (
  publicKey: Buffer | undefined,
): Promise<Account | undefined> => {
  if (!publicKey) return undefined
  return (await Account.findOneBy({ derive2Pubkey: Buffer.from(publicKey) })) ?? undefined
}

export const findAccountByUserIdentifier = async ({
  uuid,
  accountNr,
}: UserIdentifier): Promise<Account | undefined> => {
  const user = await User.findOne({
    where: { gradidoID: uuid, accounts: { derivationIndex: accountNr ?? 1 } },
    relations: { accounts: true },
  })
  if (user && user.accounts?.length === 1) {
    const account = user.accounts[0]
    account.user = user
    return account
  }
}

export const getKeyPair = (account: Account): KeyPair | null => {
  const km = KeyManager.getInstance()
  switch (account.type) {
    case AddressType.NONE:
      return null
    case AddressType.COMMUNITY_HUMAN:
    case AddressType.COMMUNITY_PROJECT:
    case AddressType.SUBACCOUNT:
      if (!account.user || !account.derivationIndex) {
        throw new LogError('no user or derivation index for account')
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
