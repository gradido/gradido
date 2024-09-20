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
} from 'gradido-blockchain-js'
import { crypto_generichash as cryptoHash } from 'sodium-native'

import { AccountType } from '@/graphql/enum/AccountType'

export const uuid4ToBuffer = (uuid: string): Buffer => {
  // Remove dashes from the UUIDv4 string
  const cleanedUUID = uuid.replace(/-/g, '')

  // Create a Buffer object from the hexadecimal values
  const buffer = Buffer.from(cleanedUUID, 'hex')

  return buffer
}

export const iotaTopicFromCommunityUUID = (communityUUID: string): string => {
  const hash = Buffer.alloc(32)
  cryptoHash(hash, uuid4ToBuffer(communityUUID))
  return hash.toString('hex')
}

export const base64ToBuffer = (base64: string): Buffer => {
  return Buffer.from(base64, 'base64')
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
