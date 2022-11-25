/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import DHT from '@hyperswarm/dht'
// import { Connection } from '@dbTools/typeorm'
import { backendLogger as logger } from '@/server/logger'
import CONFIG from '@/config'
import { ApiVersionType } from './enum/ApiVersionType'

const KEY_SECRET_SEEDBYTES = 32
const getSeed = (): Buffer | null =>
  CONFIG.FEDERATION_DHT_SEED ? Buffer.alloc(KEY_SECRET_SEEDBYTES, CONFIG.FEDERATION_DHT_SEED) : null

const POLLTIME = 20000
const SUCCESSTIME = 120000
const ERRORTIME = 240000
const ANNOUNCETIME = 30000
const nodeURL = CONFIG.FEDERATION_COMMUNITY_URL || 'not configured'
type CommunityApi = {
  api: string
  url: string
}

const prepareCommunityApiList = (): CommunityApi[] => {
  const apiEnumList = Object.keys(ApiVersionType)
  const communityApiList = new Array<CommunityApi>()
  apiEnumList.forEach((apiEnum) => {
    const communityApi = { api: apiEnum, url: nodeURL }
    communityApiList.push(communityApi)
  })
  return communityApiList
}

export const startDHT = async (
  // connection: Connection,
  topic: string,
): Promise<void> => {
  try {
    const TOPIC = DHT.hash(Buffer.from(topic))
    const keyPair = DHT.keyPair(getSeed())
    logger.info(`keyPairDHT: publicKey=${keyPair.publicKey.toString('hex')}`)
    logger.debug(`keyPairDHT: secretKey=${keyPair.secretKey.toString('hex')}`)
    const apiList = prepareCommunityApiList()
    logger.debug(`ApiList: ${JSON.stringify(apiList)}`)

    const node = new DHT({ keyPair })

    const server = node.createServer()

    server.on('connection', function (socket: any) {
      // noiseSocket is E2E between you and the other peer
      // pipe it somewhere like any duplex stream
      logger.info(`Remote public key: ${socket.remotePublicKey.toString('hex')}`)
      // console.log("Local public key", noiseSocket.publicKey.toString("hex")); // same as keyPair.publicKey

      socket.on('data', (data: Buffer) => logger.info(`data: ${data.toString('ascii')}`))

      // process.stdin.pipe(noiseSocket).pipe(process.stdout);
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
        // publicKey here is keyPair.publicKey from above
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
          // noiseSocket fully open with the other peer
          // console.log("writing to socket");
          apiList.forEach((apiVersion) => {
            socket.write(Buffer.from(JSON.stringify(apiVersion)))
          })
          successfulRequests.push(remotePubKey)
        })
        // pipe it somewhere like any duplex stream
        // process.stdin.pipe(noiseSocket).pipe(process.stdout)
      })
    }, POLLTIME)
  } catch (err) {
    logger.error(err)
  }
}
