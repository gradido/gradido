import {
  ConfirmedTransaction,
  DeserializeType_CONFIRMED_TRANSACTION,
  InteractionDeserialize,
  MemoryBlock,
} from 'gradido-blockchain-js'
import { AccountType } from '../data/AccountType.enum'
import { AddressType } from '../data/AddressType.enum'

export const confirmedTransactionFromBase64 = (base64: string): ConfirmedTransaction => {
  const confirmedTransactionBinaryPtr = MemoryBlock.createPtr(MemoryBlock.fromBase64(base64))
  const deserializer = new InteractionDeserialize(
    confirmedTransactionBinaryPtr,
    DeserializeType_CONFIRMED_TRANSACTION,
  )
  deserializer.run()
  const confirmedTransaction = deserializer.getConfirmedTransaction()
  if (!confirmedTransaction) {
    throw new Error("invalid data, couldn't deserialize")
  }
  return confirmedTransaction
}

/**
 * AddressType is defined in gradido-blockchain C++ Code
 * AccountType is the enum defined in TypeScript but with the same options
 */
const accountToAddressMap: Record<AccountType, AddressType> = {
  [AccountType.COMMUNITY_AUF]: AddressType.COMMUNITY_AUF,
  [AccountType.COMMUNITY_GMW]: AddressType.COMMUNITY_GMW,
  [AccountType.COMMUNITY_HUMAN]: AddressType.COMMUNITY_HUMAN,
  [AccountType.COMMUNITY_PROJECT]: AddressType.COMMUNITY_PROJECT,
  [AccountType.CRYPTO_ACCOUNT]: AddressType.CRYPTO_ACCOUNT,
  [AccountType.SUBACCOUNT]: AddressType.SUBACCOUNT,
  [AccountType.DEFERRED_TRANSFER]: AddressType.DEFERRED_TRANSFER,
  [AccountType.NONE]: AddressType.NONE,
}

const addressToAccountMap: Record<AddressType, AccountType> = Object.entries(
  accountToAddressMap,
).reduce(
  (acc, [accKey, addrVal]) => {
    acc[addrVal] = String(accKey) as AccountType
    return acc
  },
  {} as Record<AddressType, AccountType>,
)

export function isAddressType(val: unknown): val is AddressType {
  return typeof val === 'number' && Object.keys(addressToAccountMap).includes(val.toString())
}

export function isAccountType(val: unknown): val is AccountType {
  return Object.values(AccountType).includes(val as AccountType)
}

export function toAddressType(input: AccountType | AddressType): AddressType {
  if (isAddressType(input)) {
    return input
  }
  return accountToAddressMap[input as AccountType] ?? AddressType.NONE
}

export function toAccountType(input: AccountType | AddressType): AccountType {
  if (isAccountType(input)) {
    return input
  }
  return addressToAccountMap[input as AddressType] ?? AccountType.NONE
}
