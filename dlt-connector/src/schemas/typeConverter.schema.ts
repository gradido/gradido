import { ConfirmedTransaction } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { AccountType } from '../data/AccountType.enum'
import { AddressType } from '../data/AddressType.enum'
import {
  confirmedTransactionFromBase64,
  isAddressType,
  toAccountType,
  toAddressType,
} from '../utils/typeConverter'

/**
 * dateSchema for creating a date from string or Date object
 */
export const dateSchema = v.pipe(
  v.union([v.string('expect valid date string'), v.instance(Date, 'expect Date object')]),
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
  }),
)

export const booleanSchema = v.pipe(
  v.union([
    v.boolean('expect boolean type'),
    v.number('expect boolean number type'),
    v.string('expect boolean string type'),
  ]),
  v.transform<boolean | number | string, boolean>((input) => {
    if (typeof input === 'number') {
      return input !== 0
    } else if (typeof input === 'string') {
      return input === 'true'
    }
    return input
  }),
)

/**
 * AddressType is defined in gradido-blockchain C++ Code
 * AccountType is the enum defined in TypeScript but with the same options
 * addressTypeSchema and accountTypeSchema are for easy handling and conversion between both
 * Schema for address type, can also convert from account type (if used with v.parse)
 */
export const addressTypeSchema = v.pipe(
  v.union([
    v.enum(AccountType, 'expect account type'),
    v.custom<AddressType>(isAddressType, 'expect AddressType'),
  ]),
  v.transform<AccountType | AddressType, AddressType>((value) => toAddressType(value)),
)

/**
 * Schema for account type, can also convert from address type (if used with v.parse)
 */
export const accountTypeSchema = v.pipe(
  v.union([
    v.enum(AccountType, 'expect AccountType'),
    v.custom<AddressType>(isAddressType, 'expect AddressType'),
  ]),
  v.transform<AddressType | AccountType, AccountType>((value) => toAccountType(value)),
)

export const confirmedTransactionSchema = v.pipe(
  v.union([
    v.instance(ConfirmedTransaction, 'expect ConfirmedTransaction'),
    v.pipe(
      v.string('expect confirmed Transaction base64 as string type'),
      v.base64('expect to be valid base64'),
    ),
  ]),
  v.transform<string | ConfirmedTransaction, ConfirmedTransaction>(
    (data: string | ConfirmedTransaction) => {
      if (data instanceof ConfirmedTransaction) {
        return data
      }
      return confirmedTransactionFromBase64(data)
    },
  ),
)
