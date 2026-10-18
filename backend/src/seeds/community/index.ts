import { Community as DbCommunity } from 'database'
import { createEncryptionKeyPair } from 'shared'
import { Ed25519KeyPair } from 'shared-native'
import { v4 as uuidv4 } from 'uuid'

import { CONFIG } from '@/config'

// a new Ed25519 key pair the way the dht-node stores it: privateKey = seed || publicKey
function signingKeys(): { publicKey: Buffer; privateKey: Buffer } {
  const keyPair = Ed25519KeyPair.generate()
  const publicKey = keyPair.publicKeyToBuffer()
  return { publicKey, privateKey: Buffer.concat([keyPair.privateKeyToBuffer(), publicKey]) }
}

export async function writeHomeCommunityEntry(): Promise<DbCommunity> {
  try {
    // check for existing homeCommunity entry
    let homeCom = await DbCommunity.findOne({ where: { foreign: false } })
    if (homeCom) {
      // simply update the existing entry, but it MUST keep the ID and UUID because of possible relations
      const { publicKey, privateKey } = signingKeys()
      homeCom.publicKey = publicKey
      homeCom.privateKey = privateKey
      homeCom.url = 'http://localhost/api/'
      homeCom.name = CONFIG.COMMUNITY_NAME
      homeCom.description = CONFIG.COMMUNITY_DESCRIPTION
      await DbCommunity.save(homeCom)
    } else {
      // insert a new homecommunity entry including a new ID and a new but ensured unique UUID
      homeCom = new DbCommunity()
      homeCom.foreign = false
      const { publicKey, privateKey } = signingKeys()
      homeCom.publicKey = publicKey
      homeCom.privateKey = privateKey
      homeCom.communityUuid = uuidv4() // await newCommunityUuid()
      homeCom.url = 'http://localhost/api/'
      homeCom.name = CONFIG.COMMUNITY_NAME
      homeCom.description = CONFIG.COMMUNITY_DESCRIPTION
      homeCom.creationDate = new Date()
      const encryptionKeyPair = createEncryptionKeyPair()
      homeCom.publicEncryptionKey = encryptionKeyPair.publicKey
      homeCom.privateEncryptionKey = encryptionKeyPair.privateKey
      await DbCommunity.insert(homeCom)
    }
    return homeCom
  } catch (_err) {
    throw new Error(`Seeding: Error writing HomeCommunity-Entry`) // : ${err}`)
  }
}
