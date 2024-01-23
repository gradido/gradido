import { crypto_generichash as cryptoHash } from 'sodium-native'

import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { Timestamp } from '@/data/proto/3_3/Timestamp'
import { TimestampSeconds } from '@/data/proto/3_3/TimestampSeconds'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { AccountType } from '@/graphql/enum/AccountType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'

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
  const typeString: string = AccountType[type]
  const addressType: AddressType = AddressType[typeString as keyof typeof AddressType]

  if (!addressType) {
    throw new LogError("couldn't find corresponding AddressType for AccountType", {
      accountType: type,
      addressTypes: Object.keys(AddressType),
    })
  }
  return addressType
}

export const addressTypeToAccountType = (type: AddressType): AccountType => {
  const typeString: string = AddressType[type]
  const accountType: AccountType = AccountType[typeString as keyof typeof AccountType]

  if (!accountType) {
    throw new LogError("couldn't find corresponding AccountType for AddressType", {
      addressTypes: type,
      accountType: Object.keys(AccountType),
    })
  }
  return accountType
}
