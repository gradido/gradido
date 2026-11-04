import { Community as DbCommunity } from 'database'
import { createKeyPair, HomeCommunityInsertInput } from 'shared'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
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
      // simply update the existing entry, but it MUST keep the ID and UUID because of possible
      // relations, and its keys never change
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
      const encryptionKeyPair = X25519KeyPair.generate()
      homeCom.publicEncryptionKey = encryptionKeyPair.publicKeyToBuffer()
      homeCom.privateEncryptionKey = encryptionKeyPair.privateKeyToBuffer()
      await DbCommunity.insert(homeCom)
    }
    return homeCom
  } catch (_err) {
    throw new Error(`Seeding: Error writing HomeCommunity-Entry`) // : ${err}`)
  }
}

/**
 * A complete home community for an empty database, with every key a running one has - the JWT
 * pair included, which the dht-node writes on insert. For the seed, which writes it with
 * dbInsertHomeCommunity inside its transaction.
 */
export async function buildHomeCommunity(): Promise<HomeCommunityInsertInput> {
  const { publicKey, privateKey } = signingKeys()
  const encryptionKeyPair = X25519KeyPair.generate()
  const jwtKeyPair = await createKeyPair()
  return {
    publicKey,
    privateKey,
    communityUuid: uuidv4(),
    url: 'http://localhost/api/',
    name: CONFIG.COMMUNITY_NAME,
    description: CONFIG.COMMUNITY_DESCRIPTION,
    creationDate: new Date(),
    publicJwtKey: jwtKeyPair.publicKey,
    privateJwtKey: jwtKeyPair.privateKey,
    publicEncryptionKey: encryptionKeyPair.publicKeyToBuffer(),
    privateEncryptionKey: encryptionKeyPair.privateKeyToBuffer(),
  }
}
