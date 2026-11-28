import { generateKeyPairSync } from 'node:crypto'
import DHT from '@hyperswarm/dht'
import { httpUrlSchema } from 'config-schema'
import {
  dbInsertHomeCommunity,
  dbReplaceHomeCommunitySigningKeys,
  dbSelectHomeCommunity,
  dbUpdateHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import {
  createKeyPair as createJWTKeyPair,
  FEDERATION_AUTHENTICATION_TIMEOUT_MS,
  getChangedFields,
  HomeCommunityUpdateInput,
  publicHttpUrlSchema,
} from 'shared'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { validateCommunity } from './validateCommunity'

const KEY_SECRET_SEEDBYTES = 32

const POLLTIME = 20000
const SUCCESSTIME = 120000
const ERRORTIME = 240000
const ANNOUNCETIME = 30000
// the most a url may be long, as the communities table holds it
const MAX_URL_LENGTH = 255
const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.dht_node`)

type KeyPair = { publicKey: Buffer; secretKey: Buffer }

// what this community knows of a peer, times in ms
type Peer = {
  // when it last sent its url or came back from a lookup
  lastSeenAt: number
  // when it was last asked for its community infos
  lastAttemptAt?: number
  // before this, it is not connected to again to be sent our url
  nextConnectAt?: number
}

function isAscii(buffer: Buffer): boolean {
  for (const byte of buffer) {
    if (byte > 127) {
      return false
    }
  }
  return true
}

export const startDHT = async (topic: string): Promise<void> => {
  // the home community's key pair, the same on every start; a seed that does not belong to the
  // home community must stop the start, so this is outside the catch below
  const keyPair = DHT.keyPair(Buffer.from(CONFIG.FEDERATION_DHT_SEED, 'hex')) as KeyPair
  const pubKeyString = keyPair.publicKey.toString('hex')
  logger.info(`keyPairDHT: publicKey=${pubKeyString}`)
  logger.debug(`keyPairDHT: secretKey=${keyPair.secretKey.toString('hex').slice(0, 6)}`)
  await writeHomeCommunityEntry(keyPair)

  try {
    const TOPIC = DHT.hash(Buffer.from(topic))
    // what this community announces to every peer it finds: its federation endpoint
    const homeUrl = `${CONFIG.FEDERATION_COMMUNITY_URL}/api/`
    // the peers this community has seen, by their public key as hex
    const peers = new Map<string, Peer>()
    const seen = (remotePubKey: string, now: number): Peer => {
      const peer = peers.get(remotePubKey) ?? { lastSeenAt: now }
      peer.lastSeenAt = now
      peers.set(remotePubKey, peer)
      return peer
    }

    const node = new DHT({ keyPair })

    const server = node.createServer()

    server.on('connection', function (socket: any) {
      logger.info(`server on... with Remote public key: ${socket.remotePublicKey.toString('hex')}`)
      socket.on('data', async (data: Buffer) => {
        try {
          if (data.length > MAX_URL_LENGTH) {
            logger.warn(
              `received more than max allowed length of data buffer: ${data.length} against ${MAX_URL_LENGTH} max allowed`,
            )
            return
          }
          if (!isAscii(data)) {
            logger.warn(`received non ascii character, content as hex: ${data.toString('hex')}`)
            return
          }
          const url = data.toString('ascii')
          logger.info(`data: ${url}`)
          // a peer's url points to the internet; on a developer's machine the communities run on
          // localhost
          if (!v.is(CONFIG.PRODUCTION ? publicHttpUrlSchema : httpUrlSchema, url)) {
            logger.warn(`received invalid url: ${url}`)
            return
          }
          const now = Date.now()
          const peer = seen(socket.remotePublicKey.toString('hex'), now)
          // one request per peer and SUCCESSTIME, however often it connects; a request still
          // running counts as made
          if (peer.lastAttemptAt !== undefined && now - peer.lastAttemptAt < SUCCESSTIME) {
            return
          }
          peer.lastAttemptAt = now
          await validateCommunity(url, socket.remotePublicKey)
        } catch (e) {
          logger.error('Error on receiving data from socket:', e)
        }
      })
    })

    await server.listen()

    setInterval(async () => {
      logger.info(`Announcing on topic: ${TOPIC.toString('hex')}`)
      await node.announce(TOPIC, keyPair).finished()
    }, ANNOUNCETIME)

    setInterval(() => {
      // only the peers not seen for as long as a community stays reachable without an answer: a
      // peer still announcing itself keeps its entry, and with it its deadlines
      const now = Date.now()
      for (const [remotePubKey, { lastSeenAt }] of peers) {
        if (now - lastSeenAt >= FEDERATION_AUTHENTICATION_TIMEOUT_MS) {
          peers.delete(remotePubKey)
        }
      }
    }, SUCCESSTIME)

    setInterval(async () => {
      const result = await node.lookup(TOPIC)

      for await (const data of result) {
        for (const { publicKey } of data.peers) {
          const remotePubKey = publicKey.toString('hex')
          if (remotePubKey === pubKeyString) {
            continue
          }
          const now = Date.now()
          const peer = seen(remotePubKey, now)
          // a connection on its way counts as made: a peer that comes back from several DHT
          // nodes is connected once
          if (peer.nextConnectAt !== undefined && now < peer.nextConnectAt) {
            continue
          }
          peer.nextConnectAt = now + SUCCESSTIME
          const socket = node.connect(publicKey)
          socket.once('error', (err: any) => {
            peer.nextConnectAt = Date.now() + ERRORTIME
            logger.error(`error on peer ${remotePubKey}: ${err.message}`)
          })
          socket.on('open', function () {
            socket.write(Buffer.from(homeUrl))
            peer.nextConnectAt = Date.now() + SUCCESSTIME
          })
        }
      }
    }, POLLTIME)
  } catch (err) {
    logger.error('DHT unexpected error:', err)
  }
}

async function writeHomeCommunityEntry(keyPair: KeyPair): Promise<void> {
  try {
    // TODO: replace with upsert
    // the fields an existing home community takes over from the config; its keys never change
    const updatableFields = {
      url: `${CONFIG.FEDERATION_COMMUNITY_URL}/api/`,
      name: CONFIG.COMMUNITY_NAME,
      description: CONFIG.COMMUNITY_DESCRIPTION,
    } satisfies HomeCommunityUpdateInput

    const homeCom = await dbSelectHomeCommunity()
    if (homeCom) {
      if (!homeCom.publicKey.equals(keyPair.publicKey)) {
        await replaceFillSeedKeys(homeCom.publicKey, keyPair)
      }
      const updateFields = getChangedFields(homeCom, updatableFields)
      if (updateFields.success) {
        // simply update the existing entry, but it MUST keep the ID and UUID because of possible relations
        await dbUpdateHomeCommunity(updateFields.value)
        logger.info('home-community updated successfully')
      } else {
        logger.debug("home-community don't need update")
      }
    } else {
      const jwtKeyPair = await createJWTKeyPair()
      const encryptionKeyPair = createEncryptionKeyPair()
      await dbInsertHomeCommunity({
        ...updatableFields,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.secretKey,
        communityUuid: uuidv4(),
        creationDate: new Date(),
        publicJwtKey: jwtKeyPair.publicKey,
        privateJwtKey: jwtKeyPair.privateKey,
        publicEncryptionKey: encryptionKeyPair.publicKey,
        privateEncryptionKey: encryptionKeyPair.privateKey,
      })
      logger.info('home-community inserted successfully')
    }
  } catch (err) {
    throw new Error(`Federation: Error writing HomeCommunity-Entry: ${err}`)
  }
}

export function createEncryptionKeyPair(): { publicKey: Buffer; privateKey: Buffer } {
  const jwk = generateKeyPairSync('x25519').privateKey.export({ format: 'jwk' })
  if (!jwk.x || !jwk.d) {
    throw new Error('X25519 key exported without its raw parts')
  }
  return { publicKey: Buffer.from(jwk.x, 'base64url'), privateKey: Buffer.from(jwk.d, 'base64url') }
}

/**
 * Until 10.2026 the seed was not decoded from hex but used as fill string, its first 32
 * characters as bytes. A home community with the key of that seed gets the key of the decoded
 * one, once; any other key does not belong to FEDERATION_DHT_SEED and stops the start.
 * TODO: remove once every community has started once with the decoded seed
 */
async function replaceFillSeedKeys(storedPublicKey: Buffer, keyPair: KeyPair): Promise<void> {
  const fillSeedKeyPair = DHT.keyPair(
    Buffer.alloc(KEY_SECRET_SEEDBYTES, CONFIG.FEDERATION_DHT_SEED),
  ) as KeyPair
  if (!storedPublicKey.equals(fillSeedKeyPair.publicKey)) {
    throw new Error('FEDERATION_DHT_SEED does not belong to the existing home community')
  }
  await dbReplaceHomeCommunitySigningKeys(keyPair.publicKey, keyPair.secretKey)
  logger.warn(
    `home-community key replaced, now derived from the hex-decoded seed: ${storedPublicKey.toString('hex')} -> ${keyPair.publicKey.toString('hex')}`,
  )
}
