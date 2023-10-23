import { crypto_generichash as cryptoHash } from 'sodium-native'

import { Timestamp } from '@/data/proto/3_3/Timestamp'
import { TimestampSeconds } from '@/data/proto/3_3/TimestampSeconds'
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
