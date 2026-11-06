import {
  CommunitiesSelect,
  dbInsertHomeCommunity,
  dbSelectHomeCommunity,
  dbUpdateHomeCommunity,
} from 'database'
import { createKeyPair, HomeCommunityInsertInput, MissingHomeCommunityError } from 'shared'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import { v4 as uuidv4 } from 'uuid'

import { CONFIG } from '@/config'

const HOME_COMMUNITY_URL = 'http://localhost/api/'

// a new Ed25519 key pair the way the dht-node stores it: privateKey = seed || publicKey
function signingKeys(): { publicKey: Buffer; privateKey: Buffer } {
  const keyPair = Ed25519KeyPair.generate()
  const publicKey = keyPair.publicKeyToBuffer()
  return { publicKey, privateKey: Buffer.concat([keyPair.privateKeyToBuffer(), publicKey]) }
}

/**
 * The home community for a test: written complete if there is none, and otherwise set to this
 * configuration. An existing one MUST keep its id and uuid because of possible relations, and its
 * keys never change.
 */
export async function writeHomeCommunityEntry(): Promise<CommunitiesSelect> {
  const homeCommunity = await dbSelectHomeCommunity()
  if (!homeCommunity) {
    await dbInsertHomeCommunity(await buildHomeCommunity())
  } else if (
    homeCommunity.url !== HOME_COMMUNITY_URL ||
    homeCommunity.name !== CONFIG.COMMUNITY_NAME ||
    homeCommunity.description !== CONFIG.COMMUNITY_DESCRIPTION
  ) {
    await dbUpdateHomeCommunity({
      url: HOME_COMMUNITY_URL,
      name: CONFIG.COMMUNITY_NAME,
      description: CONFIG.COMMUNITY_DESCRIPTION,
    })
  }
  const written = await dbSelectHomeCommunity()
  if (!written) {
    throw new MissingHomeCommunityError()
  }
  return written
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
    url: HOME_COMMUNITY_URL,
    name: CONFIG.COMMUNITY_NAME,
    description: CONFIG.COMMUNITY_DESCRIPTION,
    creationDate: new Date(),
    publicJwtKey: jwtKeyPair.publicKey,
    privateJwtKey: jwtKeyPair.privateKey,
    publicEncryptionKey: encryptionKeyPair.publicKeyToBuffer(),
    privateEncryptionKey: encryptionKeyPair.privateKeyToBuffer(),
  }
}
