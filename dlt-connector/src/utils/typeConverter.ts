import { crypto_generichash as cryptoHash } from 'sodium-native'

import { Timestamp } from '@/data/proto/3_3/Timestamp'
import { TimestampSeconds } from '@/data/proto/3_3/TimestampSeconds'
import { AccountType } from '@/graphql/enum/AccountType'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { LogError } from '@/server/LogError'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { logger } from '@/server/logger'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'

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

export const timestampToDate = (timestamp: Timestamp): Date => {
  let milliseconds = timestamp.nanoSeconds / 1000000
  milliseconds += timestamp.seconds * 1000
  return new Date(milliseconds)
}

export const timestampSecondsToDate = (timestamp: TimestampSeconds): Date => {
  return new Date(timestamp.seconds * 1000)
}

export const base64ToBuffer = (base64: string): Buffer => {
  return Buffer.from(base64, 'base64')
}

export const bodyBytesToTransactionBody = (bodyBytes: Buffer): TransactionBody => {
  try {
    return TransactionBody.decode(new Uint8Array(bodyBytes))
  } catch (error) {
    logger.error('error decoding body from gradido transaction: %s', error)
    throw new TransactionError(
      TransactionErrorType.PROTO_DECODE_ERROR,
      'cannot decode body from gradido transaction',
    )
  }
}

export const transactionBodyToBodyBytes = (transactionBody: TransactionBody): Buffer => {
  try {
    return Buffer.from(TransactionBody.encode(transactionBody).finish())
  } catch (error) {
    logger.error('error encoding transaction body to body bytes', error)
    throw new TransactionError(
      TransactionErrorType.PROTO_ENCODE_ERROR,
      'cannot encode transaction body',
    )
  }
}

export const accountTypeToAddressType = (accountType: AccountType): AddressType => {
  switch (accountType) {
    case AccountType.NONE:
      return AddressType.NONE
    case AccountType.COMMUNITY_HUMAN:
      return AddressType.COMMUNITY_HUMAN
    case AccountType.COMMUNITY_GMW:
      return AddressType.COMMUNITY_GMW
    case AccountType.COMMUNITY_AUF:
      return AddressType.COMMUNITY_AUF
    case AccountType.COMMUNITY_PROJECT:
      return AddressType.COMMUNITY_PROJECT
    case AccountType.SUBACCOUNT:
      return AddressType.SUBACCOUNT
    case AccountType.CRYPTO_ACCOUNT:
      return AddressType.CRYPTO_ACCOUNT
    default:
      throw new LogError(`Unsupported AccountType: ${accountType}`)
  }
}

export const addressTypeToAccountType = (addressType: AddressType): AccountType => {
  switch (addressType) {
    case AddressType.NONE:
      return AccountType.NONE
    case AddressType.COMMUNITY_HUMAN:
      return AccountType.COMMUNITY_HUMAN
    case AddressType.COMMUNITY_GMW:
      return AccountType.COMMUNITY_GMW
    case AddressType.COMMUNITY_AUF:
      return AccountType.COMMUNITY_AUF
    case AddressType.COMMUNITY_PROJECT:
      return AccountType.COMMUNITY_PROJECT
    case AddressType.SUBACCOUNT:
      return AccountType.SUBACCOUNT
    case AddressType.CRYPTO_ACCOUNT:
      return AccountType.CRYPTO_ACCOUNT
    default:
      throw new LogError(`Unsupported AddressType: ${addressType}`)
  }
}
