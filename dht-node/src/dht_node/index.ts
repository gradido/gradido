/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import DHT from '@hyperswarm/dht'
import { logger } from '@/server/logger'
import CONFIG from '@/config'
import { Community as DbCommunity } from '@entity/Community'

const KEY_SECRET_SEEDBYTES = 32
const getSeed = (): Buffer | null =>
  CONFIG.FEDERATION_DHT_SEED ? Buffer.alloc(KEY_SECRET_SEEDBYTES, CONFIG.FEDERATION_DHT_SEED) : null

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

    const ownApiVersions = writeHomeCommunityEnries(keyPair.publicKey)
    /*
    const ownApiVersions = Object.values(ApiVersionType).map(function (apiEnum) {
      const comApi: CommunityApi = {
        api: apiEnum,
        url: CONFIG.FEDERATION_COMMUNITY_URL,
      }
      return comApi
    })
    */
    logger.debug(`ApiList: ${JSON.stringify(ownApiVersions)}`)

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
            await DbCommunity.createQueryBuilder()
              .insert()
              .into(DbCommunity)
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

async function writeHomeCommunityEnries(pubKey: any): Promise<CommunityApi[]> {
  const homeApiVersions: CommunityApi[] = Object.values(ApiVersionType).map(function (
    apiEnum,
    idx,
  ) {
    const port = Number.parseInt(CONFIG.FEDERATION_COMMUNITY_API_PORT) + idx + 1
    const comApi: CommunityApi = {
      api: apiEnum,
      url: CONFIG.FEDERATION_COMMUNITY_URL + ':' + port.toString() + '/api/',
    }
    return comApi
  })
  try {
    // first remove privious existing homeCommunity entries
    const homeComs = await DbCommunity.find({ foreign: false })
    if (homeComs.length > 0) {
      await DbCommunity.remove(homeComs)
    }

    homeApiVersions.forEach(async function (homeApi) {
      const homeCom = new DbCommunity()
      homeCom.foreign = false
      homeCom.apiVersion = homeApi.api
      homeCom.endPoint = homeApi.url
      homeCom.publicKey = pubKey.toString('hex')

      // this will NOT update the updatedAt column, to distingue between a normal update and the last announcement
      await DbCommunity.insert(homeCom)
      logger.info(`federation home-community inserted successfully: ${JSON.stringify(homeCom)}`)
    })
  } catch (err) {
    throw new Error(`Federation: Error writing HomeCommunity-Entries: ${err}`)
  }

  return homeApiVersions
}
