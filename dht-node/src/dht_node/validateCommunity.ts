import { randomBytes } from 'node:crypto'
// the client only: all of core would bring its e-mails into the bundle
import { ApiClientCache } from 'core/apiClient'
import {
  CommunitiesInsert,
  CommunityUniqueKey,
  DBUniqueKeyViolation,
  dbFindForeignCommunityByUuid,
  dbInsertForeignCommunity,
  dbUpdateForeignCommunity,
  getHomeCommunityDrizzle,
} from 'database'
import { getLogger } from 'log4js'
import {
  foreignCommunityInfoSchema,
  foreignCommunityInsertSchema,
  foreignCommunityUpdatesSchema,
} from 'shared'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.validateCommunity`)

/**
 * Asks a community that announced itself in the DHT for its community infos and writes the
 * answer into the communities table: a new community is inserted, a known one updated, and
 * both marked verified. Any failure is logged, never thrown.
 * @param url the federation endpoint as announced, e.g. `https://host/api/`
 * @param publicKey the key the peer announced with; the answer must be signed with it
 */
export async function validateCommunity(url: string, publicKey: Buffer): Promise<void> {
  const logger = createLogger()
  logger.addContext('apiUrl', url)
  try {
    const fedCom = await getInfoCheckPublicKey(url, publicKey)
    if (!fedCom) {
      return
    }
    const now = new Date()
    const existingCom = await dbFindForeignCommunityByUuid(fedCom.communityUuid)
    if (existingCom) {
      if (!fedCom.publicKey.equals(existingCom.publicKey)) {
        logger.error(
          `${existingCom.name} foreign community public key isn't equal to the stored version`,
        )
      } else if (fedCom.url !== existingCom.url) {
        // TODO: show the admin, let admin decide if update was legit
        logger.error(`${existingCom.name} changed url from ${existingCom.url} to ${fedCom.url}`)
      } else if (!fedCom.publicEncryptionKey.equals(existingCom.publicEncryptionKey)) {
        logger.error(
          `${existingCom.name} foreign community public encryption key isn't equal to the stored version`,
        )
      } else if (
        fedCom.name !== existingCom.name ||
        fedCom.description !== existingCom.description ||
        fedCom.hieroTopicId !== existingCom.hieroTopicId
      ) {
        await dbUpdateForeignCommunity(existingCom.id, {
          ...v.parse(foreignCommunityUpdatesSchema, { ...fedCom, updatedAt: now }),
          verifiedAt: now,
        })
      } else {
        await dbUpdateForeignCommunity(existingCom.id, { verifiedAt: now })
      }
      return
    }
    // without a handshake, the signed answer with the announced key is the authentication
    const result = await dbInsertForeignCommunity(
      v.parse(foreignCommunityInsertSchema, {
        ...fedCom,
        authenticatedAt: now,
        verifiedAt: now,
        updatedAt: now,
      }),
    )
    if (result.success) {
      logger.info(`new community added: ${fedCom.name}`)
      return
    }
    if (result.error instanceof DBUniqueKeyViolation) {
      const field = result.error.uniqueKey
      if (field === CommunityUniqueKey.COMMUNITY_UUID) {
        logger.error(`Community UUID Collision detected with uuid: ${fedCom.communityUuid}`)
        return
      } else if (field === CommunityUniqueKey.PUBLIC_KEY) {
        logger.error(`public key already in use: ${fedCom.publicKey.toString('hex')}`)
        return
      } else if (field === CommunityUniqueKey.URL) {
        logger.warn(
          `foreign community url already in use: name: ${fedCom.name}, url: ${fedCom.url}`,
        )
        return
      }
    }
    throw result.error
  } catch (e) {
    logger.error('Error: ', e)
  }
}

async function getInfoCheckPublicKey(
  url: string,
  publicKey: Buffer,
): Promise<CommunitiesInsert | null> {
  const logger = createLogger()
  logger.addContext('apiUrl', url)

  // the announced public key as a key pair, as soon as it is used as a key
  const peerClient = ApiClientCache.getInstance().getByUrl(url, new Ed25519KeyPair(publicKey))
  // the client refuses an answer whose signature does not verify against that key
  const exchangeId = randomBytes(16).toString('hex')
  const { data: rawPubComInfo, error } = await peerClient.getCommunityInfos(exchangeId)
  if (!rawPubComInfo) {
    logger.warn('missing result of getPublicCommunityInfo', error?.value)
    return null
  }
  if (rawPubComInfo.exchangeId !== exchangeId) {
    logger.warn(`response don't use our own exchange id`)
    return null
  }
  const pubComInfo = v.parse(foreignCommunityInfoSchema, rawPubComInfo)

  if (!pubComInfo.publicKey.equals(publicKey)) {
    logger.warn(
      'received not matching publicKey',
      pubComInfo.publicKey.toString('hex'),
      publicKey.toString('hex'),
    )
    return null
  }
  if (pubComInfo.communityUuid === (await getHomeCommunityDrizzle()).communityUuid) {
    logger.error(`another community uses our own community uuid: ${pubComInfo.name}`, url)
    return null
  }
  peerClient.publicEncryptionKey = new X25519KeyPair(pubComInfo.publicEncryptionKey)
  return { foreign: true, url, ...pubComInfo }
}

export const getInfoCheckPublicKey__test = getInfoCheckPublicKey
