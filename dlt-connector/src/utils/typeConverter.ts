import { crypto_generichash as cryptoHash } from 'sodium-native'

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
