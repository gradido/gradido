import { AddressType } from '@proto/3_3/enum/AddressType'
import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { KeyManager } from './KeyManager'
import { LogError } from '@/server/LogError'
import { KeyPair } from '../model/KeyPair'
import {
  getKeyPair as getUserKeyPair,
  confirm as confirmUser,
  createFromProto as createUserFromProto,
  findByPublicKey,
  findByPublicKeyWithAccount,
} from './User'
import { hardenDerivationIndex } from '@/utils/derivationHelper'
import Decimal from 'decimal.js-light'
import { In } from '@dbTools/typeorm'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { User } from '@entity/User'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import {
  accountTypeToAddressType,
  timestampSecondsToDate,
  timestampToDate,
} from '@/utils/typeConverter'
import { getDataSource } from '@/typeorm/DataSource'
import { ConfirmedTransaction } from '@/proto/3_3/ConfirmedTransaction'
import { getBody } from './GradidoTransaction'
import { RegisterAddress } from '@/proto/3_3/RegisterAddress'

const GMW_ACCOUNT_DERIVATION_INDEX = 1
const AUF_ACCOUNT_DERIVATION_INDEX = 2

export const create = (
  derive2Pubkey: Buffer,
  type: AddressType,
  createdAt: Date,
  derivationIndex?: number,
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

export const createFromProto = async (
  confirmedTransaction: ConfirmedTransaction,
): Promise<Account | User> => {
  const body = getBody(confirmedTransaction.transaction)
  const registerAddress = body.registerAddress
  if (!registerAddress) {
    throw new LogError('wrong type of transaction, registerAddress expected')
  }
  const account = Account.create()
  let user: User | null = null
  if (registerAddress.userPubkey && registerAddress.userPubkey.length === 32) {
    if (registerAddress.addressType === AddressType.COMMUNITY_HUMAN) {
      return createUserFromProto(confirmedTransaction)
    } else {
      user = await findByPublicKey(registerAddress.userPubkey)
      account.derive2Pubkey = Buffer.from(registerAddress.userPubkey)
    }
  }
  // subaccount has higher priority as userPubkey so it maybe overwrite already set pubkey, but this is intentionally
  if (registerAddress.subaccountPubkey && registerAddress.subaccountPubkey.length === 32) {
    account.derive2Pubkey = Buffer.from(registerAddress.subaccountPubkey)
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

export const confirm = async (
  registerAddress: RegisterAddress,
  confirmedAt: Date,
): Promise<boolean> => {
  let publicKey: Buffer | undefined
  if (registerAddress.subaccountPubkey && registerAddress.subaccountPubkey.length === 32) {
    publicKey = Buffer.from(registerAddress.subaccountPubkey)
  } else if (registerAddress.userPubkey && registerAddress.userPubkey.length === 32) {
    if (registerAddress.addressType === AddressType.COMMUNITY_HUMAN) {
      if (!(await confirmUser(registerAddress, confirmedAt))) {
        throw new LogError("couldn't confirm User")
      }
      const user = await findByPublicKeyWithAccount(registerAddress.userPubkey, 1)
      if (!user || user.accounts?.length !== 1) {
        throw new LogError("couldn't find first (contribution) account for user in db!")
      }
      user.accounts[0].confirmedAt = confirmedAt
      user.accounts[0].save()
      return true
    }
    publicKey = Buffer.from(registerAddress.userPubkey)
  }
  if (!publicKey) {
    throw new LogError("invalid Register Address, could't find a public key")
  }
  const result = await getDataSource()
    .createQueryBuilder()
    .update(Account)
    .set({ confirmedAt })
    .where('derive2Pubkey = :publicKey', { publicKey })
    .execute()
  if (result.affected && result.affected > 1) {
    throw new LogError('more than one account matched by publicKey: %s', publicKey.toString('hex'))
  }
  return result.affected === 1
}

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

export const findAccountsByPublicKeys = (publicKeys: Buffer[]): Promise<Account[]> => {
  return Account.findBy({ derive2Pubkey: In(publicKeys) })
}

export const findAccountByPublicKey = async (
  publicKey: Buffer | undefined,
): Promise<Account | undefined> => {
  if (!publicKey) return undefined
  return (await Account.findOneBy({ derive2Pubkey: Buffer.from(publicKey) })) ?? undefined
}

export const createCommunitySpecialAccounts = (community: Community): void => {
  const km = KeyManager.getInstance()

  // create account for gmw account
  const gmwDerivationIndex = hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX)
  community.gmwAccount = create(
    km.derive([gmwDerivationIndex]).publicKey,
    AddressType.COMMUNITY_GMW,
    community.createdAt,
    gmwDerivationIndex,
  )

  // create account for auf account
  const aufDerivationIndex = hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX)
  community.aufAccount = create(
    km.derive([aufDerivationIndex]).publicKey,
    AddressType.COMMUNITY_AUF,
    community.createdAt,
    aufDerivationIndex,
  )
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
