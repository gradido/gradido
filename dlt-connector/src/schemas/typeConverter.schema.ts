import {
  AddressType as AddressType,
  AddressType_COMMUNITY_AUF,
  AddressType_COMMUNITY_GMW,
  AddressType_COMMUNITY_HUMAN,
  AddressType_COMMUNITY_PROJECT,
  AddressType_CRYPTO_ACCOUNT,
  AddressType_NONE,
  AddressType_SUBACCOUNT,
  ConfirmedTransaction,
  DeserializeType_CONFIRMED_TRANSACTION,
  InteractionDeserialize,
  MemoryBlock,
} from 'gradido-blockchain-js'
import { AccountType } from '../enum/AccountType'
// import { AddressType as AddressTypeWrapper } from '../enum/AddressType'
import * as v from 'valibot'

/**
 * dateSchema for creating a date from string or Date object
 */
export const dateSchema = v.pipe(
  v.union([
    v.string('expect valid date string'),
    v.instance(Date, 'expect Date object')
  ]),
  v.transform<string | Date, Date>((input) => {
    let date: Date 
    if (input instanceof Date) {
      date = input
    } else {
      date = new Date(input)
    }
    if (isNaN(date.getTime())) {
      throw new Error('invalid date')
    }
    return date
  })
)

/**
 * AddressType is defined in gradido-blockchain C++ Code
 * AccountType is the enum defined in TypeScript but with the same options
 * addressTypeSchema and accountTypeSchema are for easy handling and conversion between both
 */

const accountToAddressMap: Record<AccountType, AddressType> = {
  [AccountType.COMMUNITY_AUF]: AddressType_COMMUNITY_AUF,
  [AccountType.COMMUNITY_GMW]: AddressType_COMMUNITY_GMW,
  [AccountType.COMMUNITY_HUMAN]: AddressType_COMMUNITY_HUMAN,
  [AccountType.COMMUNITY_PROJECT]: AddressType_COMMUNITY_PROJECT,
  [AccountType.CRYPTO_ACCOUNT]: AddressType_CRYPTO_ACCOUNT,
  [AccountType.SUBACCOUNT]: AddressType_SUBACCOUNT,
  [AccountType.NONE]: AddressType_NONE,
}

const addressToAccountMap: Record<AddressType, AccountType> = Object.entries(accountToAddressMap).reduce((acc, [accKey, addrVal]) => {
  acc[addrVal] = String(accKey) as AccountType
  return acc;
}, {} as Record<AddressType, AccountType>)

function isAddressType(val: unknown): val is AddressType {
  return typeof val === 'number' && Object.keys(addressToAccountMap).includes(val.toString())
}

function isAccountType(val: unknown): val is AccountType {
  return Object.values(AccountType).includes(val as AccountType);
}

/**
 * Schema for address type, can also convert from account type (if used with v.parse)
 */
export const addressTypeSchema = v.pipe(
  v.union([
    v.enum(AccountType, 'expect account type'),
    v.custom<AddressType>((val): val is AddressType => isAddressType(val), 'expect AddressType'),
  ]),
  v.transform<AccountType | AddressType, AddressType>((value) => {
    if (isAddressType(value)) {
      return value;
    }
    return accountToAddressMap[value as AccountType] ?? AddressType_NONE
  }),
)

/**
 * Schema for account type, can also convert from address type (if used with v.parse)
 */
export const accountTypeSchema = v.pipe(
  v.union([
    v.custom<AddressType>(isAddressType, 'expect AddressType'),
    v.enum(AccountType, 'expect AccountType'),
  ]),
  v.transform<AddressType | AccountType, AccountType>((value) => {
    if (isAccountType(value)) {
      return value;
    }
    return addressToAccountMap[value as AddressType] ?? AccountType.NONE;
  }),
)

const confirmedTransactionFromBase64 = (base64: string): ConfirmedTransaction => {
  const deserializer = new InteractionDeserialize(
    MemoryBlock.fromBase64(base64),
    DeserializeType_CONFIRMED_TRANSACTION,
  )
  deserializer.run()
  const confirmedTransaction = deserializer.getConfirmedTransaction()
  if (!confirmedTransaction) {
    throw new Error("invalid data, couldn't deserialize")
  }
  return confirmedTransaction
}

export const confirmedTransactionFromBase64Schema = v.pipe(
  v.pipe(
    v.string('expect confirmed Transaction base64 as string type'),
    v.base64('expect to be valid base64')
  ),
  v.transform<string, ConfirmedTransaction>(
    (base64: string) => confirmedTransactionFromBase64(base64),
  ),
)


