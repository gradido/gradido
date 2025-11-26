import DHT from '@hyperswarm/dht'
import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { ApiVersionType } from './ApiVersionType'

const KEY_SECRET_SEEDBYTES = 32

const POLLTIME = 20000
const SUCCESSTIME = 120000
const ERRORTIME = 240000
const ANNOUNCETIME = 30000
const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.dht_node`)

type CommunityApi = {
  api: string
  url: string
}

type KeyPair = { publicKey: Buffer; secretKey: Buffer }

function isAscii(buffer: Buffer): boolean {
  for (const byte of buffer) {
    if (byte > 127) {
      return false
    }
  }
  return true
}

export const startDHT = async (topic: string): Promise<void> => {
  try {
    const TOPIC = DHT.hash(Buffer.from(topic))
    // uses a config defined seed or null, which will generate a random seed for the key pair
    const keyPair = DHT.keyPair(
      CONFIG.FEDERATION_DHT_SEED
        ? Buffer.alloc(KEY_SECRET_SEEDBYTES, CONFIG.FEDERATION_DHT_SEED)
        : null,
    ) as KeyPair
    const pubKeyString = keyPair.publicKey.toString('hex')
    logger.info(`keyPairDHT: publicKey=${pubKeyString}`)
    logger.debug(`keyPairDHT: secretKey=${keyPair.secretKey.toString('hex').slice(0, 6)}`)
    await writeHomeCommunityEntry(keyPair)

    const ownApiVersions = await writeFederatedHomeCommunityEntries(pubKeyString)
    logger.info(`ApiList: ${JSON.stringify(ownApiVersions)}`)

    const node = new DHT({ keyPair })

    const server = node.createServer()

    server.on('connection', function (socket: any) {
      logger.info(`server on... with Remote public key: ${socket.remotePublicKey.toString('hex')}`)
      socket.on('data', async (data: Buffer) => {
        try {
          if (data.length > 1141) {
            logger.warn(
              `received more than max allowed length of data buffer: ${data.length} against 1141 max allowed`,
            )
            return
          }
          if (!isAscii(data)) {
            logger.warn(`received non ascii character, content as hex: ${data.toString('hex')}`)
            return
          }
          logger.info(`data: ${data.toString('ascii')}`)
          const recApiVersions: CommunityApi[] = JSON.parse(data.toString('ascii'))

          // TODO better to introduce the validation by https://github.com/typestack/class-validator
          if (!recApiVersions || !Array.isArray(recApiVersions) || recApiVersions.length >= 5) {
            logger.warn(
              `received totaly wrong or too much apiVersions-Definition JSON-String: ${JSON.stringify(
                recApiVersions,
              )}`,
            )
            return
          }
          for (const recApiVersion of recApiVersions) {
            if (
              !recApiVersion.api ||
              typeof recApiVersion.api !== 'string' ||
              !recApiVersion.url ||
              typeof recApiVersion.url !== 'string'
            ) {
              logger.warn(
                `received invalid apiVersion-Definition: ${JSON.stringify(recApiVersion)}`,
              )
              return
            }
            // TODO better to introduce the validation on entity-Level by https://github.com/typestack/class-validator
            if (recApiVersion.api.length > 10 || recApiVersion.url.length > 255) {
              logger.warn(
                `received apiVersion with content longer than max length: ${JSON.stringify(
                  recApiVersion,
                )}`,
              )
              return
            }

            const variables = {
              apiVersion: recApiVersion.api,
              endPoint: recApiVersion.url,
              publicKey: socket.remotePublicKey,
              lastAnnouncedAt: new Date(),
            }
            // this will NOT update the updatedAt column, to distingue between a normal update and the last announcement
            await DbFederatedCommunity.createQueryBuilder()
              .insert()
              .into(DbFederatedCommunity)
              .values(variables)
              .orUpdate({
                conflict_target: ['id', 'publicKey', 'apiVersion'],
                overwrite: ['end_point', 'last_announced_at'],
              })
              .execute()
            logger.info(`federation community upserted successfully...`)
          }
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

    let successfulRequests: string[] = []
    let errorfulRequests: string[] = []

    setInterval(async () => {
      logger.info('Refreshing successful nodes')
      successfulRequests = []
    }, SUCCESSTIME)

    setInterval(async () => {
      logger.info('Refreshing errorful nodes')
      errorfulRequests = []
    }, ERRORTIME)

    setInterval(async () => {
      const result = await node.lookup(TOPIC)

      const collectedPubKeys: string[] = []

      for await (const data of result) {
        data.peers.forEach((peer: any) => {
          const pubKey = peer.publicKey.toString('hex')
          if (
            pubKey !== pubKeyString &&
            !successfulRequests.includes(pubKey) &&
            !errorfulRequests.includes(pubKey) &&
            !collectedPubKeys.includes(pubKey)
          ) {
            collectedPubKeys.push(peer.publicKey.toString('hex'))
          }
        })
      }

      if (collectedPubKeys.length) {
        logger.info(`Found new peers: ${collectedPubKeys}`)
      }

      collectedPubKeys.forEach((remotePubKey) => {
        const socket = node.connect(Buffer.from(remotePubKey, 'hex'))

        // socket.once("connect", function () {
        // console.log("client side emitted connect");
        // });

        // socket.once("end", function () {
        // console.log("client side ended");
        // });

        socket.once('error', (err: any) => {
          errorfulRequests.push(remotePubKey)
          logger.error(`error on peer ${remotePubKey}: ${err.message}`)
        })

        socket.on('open', function () {
          socket.write(Buffer.from(JSON.stringify(ownApiVersions)))
          successfulRequests.push(remotePubKey)
        })
      })
    }, POLLTIME)
  } catch (err) {
    logger.error('DHT unexpected error:', err)
  }
}

async function writeFederatedHomeCommunityEntries(pubKey: string): Promise<CommunityApi[]> {
  const homeApiVersions: CommunityApi[] = CONFIG.FEDERATION_COMMUNITY_APIS.split(',').map(
    function (api) {
      if (!Object.values(ApiVersionType).includes(api as ApiVersionType)) {
        throw new Error(`Federation: unknown api version: ${api}`)
      }
      const comApi: CommunityApi = {
        api,
        url: CONFIG.FEDERATION_COMMUNITY_URL + '/api/',
      }
      return comApi
    },
  )
  try {
    // first remove previous existing homeCommunity entries
    await DbFederatedCommunity.createQueryBuilder().delete().where({ foreign: false }).execute()
    for (const homeApiVersion of homeApiVersions) {
      const homeCom = DbFederatedCommunity.create()
      homeCom.foreign = false
      homeCom.apiVersion = homeApiVersion.api
      homeCom.endPoint = homeApiVersion.url
      homeCom.publicKey = Buffer.from(pubKey, 'hex')
      await DbFederatedCommunity.insert(homeCom)
      logger.info(`federation home-community inserted successfully:`, homeApiVersion)
    }
  } catch (err) {
    throw new Error(`Federation: Error writing federated HomeCommunity-Entries: ${err}`)
  }
  return homeApiVersions
}

async function writeHomeCommunityEntry(keyPair: KeyPair): Promise<void> {
  try {
    // check for existing homeCommunity entry
    let homeCom = await getHomeCommunity()
    if (homeCom) {
      // simply update the existing entry, but it MUST keep the ID and UUID because of possible relations
      homeCom.publicKey = keyPair.publicKey
      homeCom.privateKey = keyPair.secretKey
      homeCom.url = CONFIG.FEDERATION_COMMUNITY_URL + '/api/'
      homeCom.name = CONFIG.COMMUNITY_NAME
      homeCom.description = CONFIG.COMMUNITY_DESCRIPTION
      await DbCommunity.save(homeCom)
      logger.info(`home-community updated successfully:`, new CommunityLoggingView(homeCom))
    } else {
      // insert a new homecommunity entry including a new ID and a new but ensured unique UUID
      homeCom = new DbCommunity()
      homeCom.foreign = false
      homeCom.publicKey = keyPair.publicKey
      homeCom.privateKey = keyPair.secretKey
      homeCom.communityUuid = await newCommunityUuid()
      homeCom.url = CONFIG.FEDERATION_COMMUNITY_URL + '/api/'
      homeCom.name = CONFIG.COMMUNITY_NAME
      homeCom.description = CONFIG.COMMUNITY_DESCRIPTION
      homeCom.creationDate = new Date()
      await DbCommunity.insert(homeCom)
      logger.info(`home-community inserted successfully:`, new CommunityLoggingView(homeCom))
    }
  } catch (err) {
    throw new Error(`Federation: Error writing HomeCommunity-Entry: ${err}`)
  }
}

const newCommunityUuid = async (): Promise<string> => {
  while (true) {
    const communityUuid = uuidv4()
    if ((await DbCommunity.count({ where: { communityUuid } })) === 0) {
      return communityUuid
    }
    logger.info('CommunityUuid creation conflict...', communityUuid)
  }
}
