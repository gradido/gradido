/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import DHT from '@hyperswarm/dht'
import { backendLogger as logger } from '@/server/logger'
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
  V1_0 = 'v1_0',
  V1_1 = 'v1_1',
  V2_0 = 'v2_0',
}
type CommunityApi = {
  api: string
  url: string
}

export const startDHT = async (topic: string): Promise<void> => {
  try {
    let testModeCtrl = 0
    const testModeData = [
      `hello here is a new community and i don't know how to communicate with you`,
      [`invalid type test`, `api`, `url`],
      [
        [`api`, `url`, `invalid type in array test`],
        [`wrong`, `api`, `url`],
      ],
      [
        { api: ApiVersionType.V1_0, url: 'too much versions at the same time test' },
        { api: ApiVersionType.V1_0, url: 'url2' },
        { api: ApiVersionType.V1_0, url: 'url3' },
        { api: ApiVersionType.V1_0, url: 'url4' },
        { api: ApiVersionType.V1_0, url: 'url5' },
        { api: ApiVersionType.V2_0, url: 'url6' },
      ],
      [
        { wrong: 'wrong but tolerated property test', api: ApiVersionType.V1_0, url: 'url1' },
        { api: ApiVersionType.V2_0, url: 'url2', wrong: 'wrong but tolerated property test' },
      ],
      [
        { test1: 'missing api proterty test', url: 'any url definition as string' },
        { api: 'some api', test2: 'missing url property test' },
      ],
      [
        { api: 1, url: 'wrong property type tests' },
        { api: 'urltyptest', url: 2 },
        { api: 1, url: 2 },
      ],
      [
        {
          api: ApiVersionType.V1_0,
          url: CONFIG.FEDERATION_COMMUNITY_URL + ApiVersionType.V1_0,
        },
        {
          api: ApiVersionType.V2_0,
          url: CONFIG.FEDERATION_COMMUNITY_URL + ApiVersionType.V2_0,
        },
      ],
    ]
    const TOPIC = DHT.hash(Buffer.from(topic))
    const keyPair = DHT.keyPair(getSeed())
    logger.info(`keyPairDHT: publicKey=${keyPair.publicKey.toString('hex')}`)
    logger.debug(`keyPairDHT: secretKey=${keyPair.secretKey.toString('hex')}`)

    const ownApiVersions = Object.values(ApiVersionType).map(function (apiEnum) {
      const comApi: CommunityApi = {
        api: apiEnum,
        url: CONFIG.FEDERATION_COMMUNITY_URL + apiEnum,
      }
      return comApi
    })
    logger.debug(`ApiList: ${JSON.stringify(ownApiVersions)}`)

    const node = new DHT({ keyPair })

    const server = node.createServer()

    server.on('connection', function (socket: any) {
      logger.info(`server on... with Remote public key: ${socket.remotePublicKey.toString('hex')}`)

      socket.on('data', async (data: Buffer) => {
        try {
          logger.info(`data: ${data.toString('ascii')}`)
          const recApiVersions: CommunityApi[] = JSON.parse(data.toString('ascii'))

          // TODO better to introduce the validation by https://github.com/typestack/class-validator
          if (recApiVersions && Array.isArray(recApiVersions) && recApiVersions.length < 5) {
            recApiVersions.forEach(async (recApiVersion) => {
              if (
                !recApiVersion.api ||
                typeof recApiVersion.api !== 'string' ||
                !recApiVersion.url ||
                typeof recApiVersion.url !== 'string'
              ) {
                logger.warn(
                  `received invalid apiVersion-Definition:${JSON.stringify(recApiVersion)}`,
                )
                // in a forEach-loop use return instead of continue
                return
              }
              // TODO better to introduce the validation on entity-Level by https://github.com/typestack/class-validator
              if (recApiVersion.api.length > 10 || recApiVersion.url.length > 255) {
                logger.warn(
                  `received apiVersion with content longer than max length:${JSON.stringify(
                    recApiVersion,
                  )}`,
                )
                // in a forEach-loop use return instead of continue
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
            })
          } else {
            logger.warn(
              `received totaly wrong or too much apiVersions-Definition JSON-String:${JSON.stringify(
                recApiVersions,
              )}`,
            )
          }
        } catch (e) {
          logger.error(`Error on receiving data from socket: ${JSON.stringify(e)}`)
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

      logger.info(`Found new peers: ${collectedPubKeys}`)

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
          if (CONFIG.FEDERATION_DHT_TEST_SOCKET === true) {
            logger.info(
              `test-mode for socket handshake is activated...Test:(${testModeCtrl + 1}/${
                testModeData.length
              })`,
            )
            socket.write(Buffer.from(JSON.stringify(testModeData[testModeCtrl++])))
            if (testModeCtrl >= testModeData.length) {
              testModeCtrl = 0
            }
          } else {
            socket.write(Buffer.from(JSON.stringify(ownApiVersions)))
          }
          successfulRequests.push(remotePubKey)
        })
      })
    }, POLLTIME)
  } catch (err) {
    logger.error(err)
  }
}
