/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import DHT from '@hyperswarm/dht'
import { logger } from '@/server/logger'
import CONFIG from '@/config'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { Community as DbCommunity } from '@entity/Community'
import DEVOP from '@/config/devop'
import { setDevOpEnvValue } from '@/config/tools'
import { v4 as uuidv4 } from 'uuid'

const KEY_SECRET_SEEDBYTES = 32
const getSeed = (): Buffer | null => {
  let dhtseed = DEVOP.FEDERATION_DHT_SEED
  logger.debug('dhtseed set by DEVOP.FEDERATION_DHT_SEED={}', DEVOP.FEDERATION_DHT_SEED)
  if (!dhtseed) {
    dhtseed = CONFIG.FEDERATION_DHT_SEED
    logger.debug('dhtseed overwritten by CONFIG.FEDERATION_DHT_SEED={}', CONFIG.FEDERATION_DHT_SEED)
  }
  return dhtseed ? Buffer.alloc(KEY_SECRET_SEEDBYTES, dhtseed) : null
}

const POLLTIME = 20000
const SUCCESSTIME = 120000
const ERRORTIME = 240000
const ANNOUNCETIME = 30000

enum ApiVersionType {
  V1_0 = '1_0',
  V1_1 = '1_1',
  V2_0 = '2_0',
}
type CommunityApi = {
  api: string
  url: string
}

export const startDHT = async (topic: string): Promise<void> => {
  try {
    const TOPIC = DHT.hash(Buffer.from(topic))
    const keyPair = DHT.keyPair(getSeed())
    logger.info(`keyPairDHT: publicKey=${keyPair.publicKey.toString('hex')}`)
    logger.debug(`keyPairDHT: secretKey=${keyPair.secretKey.toString('hex')}`)
    // insert or update keyPair in .env.devop file
    setDevOpEnvValue('HOME_COMMUNITY_PUBLICKEY', keyPair.publicKey.toString('hex'))
    setDevOpEnvValue('HOME_COMMUNITY_PRIVATEKEY', keyPair.secretKey.toString('hex'))
    await writeHomeCommunityEntry(keyPair.publicKey)

    const ownApiVersions = await writeFederatedHomeCommunityEntries(keyPair.publicKey)
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
              publicKey: socket.remotePublicKey.toString('hex'),
              lastAnnouncedAt: new Date(),
            }
            logger.debug(`upsert with variables=${JSON.stringify(variables)}`)
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
            pubKey !== keyPair.publicKey.toString('hex') &&
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

async function writeFederatedHomeCommunityEntries(pubKey: any): Promise<CommunityApi[]> {
  const homeApiVersions: CommunityApi[] = Object.values(ApiVersionType).map(function (apiEnum) {
    const comApi: CommunityApi = {
      api: apiEnum,
      url: CONFIG.FEDERATION_COMMUNITY_URL + '/api/',
    }
    return comApi
  })
  try {
    // first remove privious existing homeCommunity entries
    DbFederatedCommunity.createQueryBuilder().delete().where({ foreign: false }).execute()

    homeApiVersions.forEach(async function (homeApi) {
      const homeCom = new DbFederatedCommunity()
      homeCom.foreign = false
      homeCom.apiVersion = homeApi.api
      homeCom.endPoint = homeApi.url
      homeCom.publicKey = pubKey.toString('hex')

      // this will NOT update the updatedAt column, to distingue between a normal update and the last announcement
      await DbFederatedCommunity.insert(homeCom)
      logger.info(`federation home-community inserted successfully: ${JSON.stringify(homeCom)}`)
    })
  } catch (err) {
    throw new Error(`Federation: Error writing federated HomeCommunity-Entries: ${err}`)
  }
  return homeApiVersions
}

async function writeHomeCommunityEntry(pubKey: any): Promise<void> {
  try {
    // check for existing homeCommunity entry
    let homeCom = await DbCommunity.findOne({ foreign: false, publicKey: pubKey })
    if (!homeCom) {
      // check if a homecommunity with a different publicKey still exists
      homeCom = await DbCommunity.findOne({ foreign: false })
    }
    if (homeCom) {
      // simply update the existing entry, but it MUST keep the ID and UUID because of possible relations
      homeCom.publicKey = pubKey.toString('hex')
      homeCom.url = CONFIG.FEDERATION_COMMUNITY_URL
      homeCom.name = CONFIG.COMMUNITY_NAME
      homeCom.description = CONFIG.COMMUNITY_DESCRIPTION
      // this will NOT update the updatedAt column, to distingue between a normal update and the last announcement
      await DbCommunity.save(homeCom)
      logger.info(`home-community updated successfully: ${JSON.stringify(homeCom)}`)
    } else {
      // insert a new homecommunity entry including a new ID and UUID
      homeCom = new DbCommunity()
      homeCom.foreign = false
      homeCom.publicKey = pubKey.toString('hex')
      homeCom.communityUuid = await newCommunityUuid()
      homeCom.url = CONFIG.FEDERATION_COMMUNITY_URL
      homeCom.name = CONFIG.COMMUNITY_NAME
      homeCom.description = CONFIG.COMMUNITY_DESCRIPTION
      homeCom.creationDate = new Date()
      // this will NOT update the updatedAt column, to distingue between a normal update and the last announcement
      await DbCommunity.insert(homeCom)
      logger.info(`home-community inserted successfully: ${JSON.stringify(homeCom)}`)
    }
  } catch (err) {
    throw new Error(`Federation: Error writing HomeCommunity-Entry: ${err}`)
  }
}

const newCommunityUuid = async (): Promise<string> => {
  let uuid: string
  let countIds: number
  do {
    uuid = uuidv4()
    countIds = await DbCommunity.count({ where: { communityUuid: uuid } })
    if (countIds > 0) {
      logger.info('CommunityUuid creation conflict...')
    }
  } while (countIds > 0)
  return uuid
}
