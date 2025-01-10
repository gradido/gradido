/* eslint-disable camelcase */
import {
  AddressType,
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

import { AccountType } from '@/graphql/enum/AccountType'
import { LogError } from '@/server/LogError'

export const uuid4ToBuffer = (uuid: string): Buffer => {
  // Remove dashes from the UUIDv4 string
  const cleanedUUID = uuid.replace(/-/g, '')

  // Create a Buffer object from the hexadecimal values
  const buffer = Buffer.from(cleanedUUID, 'hex')

  return buffer
}

export const uuid4ToMemoryBlock = (uuid: string): MemoryBlock => {
  // Remove dashes from the UUIDv4 string
  return MemoryBlock.fromHex(uuid.replace(/-/g, ''))
}

export const uuid4sToMemoryBlock = (uuid: string[]): MemoryBlock => {
  let resultHexString = ''
  for (let i = 0; i < uuid.length; i++) {
    resultHexString += uuid[i].replace(/-/g, '')
  }
  return MemoryBlock.fromHex(resultHexString)
}

export const uuid4ToHash = (communityUUID: string): MemoryBlock => {
  return uuid4ToMemoryBlock(communityUUID).calculateHash()
}

export const base64ToBuffer = (base64: string): Buffer => {
  return Buffer.from(base64, 'base64')
}

export const communityUuidToTopic = (communityUUID: string): string => {
  return uuid4ToHash(communityUUID).convertToHex()
}

export function getEnumValue<T extends Record<string, unknown>>(
  enumType: T,
  value: number | string,
): T[keyof T] | undefined {
  if (typeof value === 'number' && typeof enumType === 'object') {
    return enumType[value as keyof T] as T[keyof T]
  } else if (typeof value === 'string') {
    for (const key in enumType) {
      if (enumType[key as keyof T] === value) {
        return enumType[key as keyof T] as T[keyof T]
      }
    }
  }
  return undefined
}

export const accountTypeToAddressType = (type: AccountType): AddressType => {
  switch (type) {
    case AccountType.COMMUNITY_AUF:
      return AddressType_COMMUNITY_AUF
    case AccountType.COMMUNITY_GMW:
      return AddressType_COMMUNITY_GMW
    case AccountType.COMMUNITY_HUMAN:
      return AddressType_COMMUNITY_HUMAN
    case AccountType.COMMUNITY_PROJECT:
      return AddressType_COMMUNITY_PROJECT
    case AccountType.CRYPTO_ACCOUNT:
      return AddressType_CRYPTO_ACCOUNT
    case AccountType.SUBACCOUNT:
      return AddressType_SUBACCOUNT
    default:
      return AddressType_NONE
  }
}

export const addressTypeToAccountType = (type: AddressType): AccountType => {
  switch (type) {
    case AddressType_COMMUNITY_AUF:
      return AccountType.COMMUNITY_AUF
    case AddressType_COMMUNITY_GMW:
      return AccountType.COMMUNITY_GMW
    case AddressType_COMMUNITY_HUMAN:
      return AccountType.COMMUNITY_HUMAN
    case AddressType_COMMUNITY_PROJECT:
      return AccountType.COMMUNITY_PROJECT
    case AddressType_CRYPTO_ACCOUNT:
      return AccountType.CRYPTO_ACCOUNT
    case AddressType_SUBACCOUNT:
      return AccountType.SUBACCOUNT
    default:
      return AccountType.NONE
  }
}

export const confirmedTransactionFromBase64 = (base64: string): ConfirmedTransaction => {
  const deserializer = new InteractionDeserialize(
    MemoryBlock.fromBase64(base64),
    DeserializeType_CONFIRMED_TRANSACTION,
  )
  deserializer.run()
  const confirmedTransaction = deserializer.getConfirmedTransaction()
  if (!confirmedTransaction) {
    throw new LogError("invalid data, couldn't deserialize")
  }
  return confirmedTransaction
}
