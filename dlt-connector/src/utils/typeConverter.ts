import { crypto_generichash as cryptoHash } from 'sodium-native'

import { Timestamp } from '@/proto/3_3/Timestamp'

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
