/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import DHT from '@hyperswarm/dht'
// import { Connection } from '@dbTools/typeorm'
import { backendLogger as logger } from '@/server/logger'
import { addFederationCommunity, resetFederationTables } from '@/dao/CommunityDAO'
import CONFIG from '../config'
import { startFederationHandshake } from './control/HandshakeControler'

const POLLTIME = 20000
const SUCCESSTIME = 120000
const ERRORTIME = 240000
const ANNOUNCETIME = 30000

export const startDHT = async (
  // connection: Connection,
  topic: string,
): Promise<void> => {
  try {
    logger.info(`start DHT-HyperSwarm with topic=${topic}...`)
    const TOPIC = DHT.hash(Buffer.from(topic))

    const keyPair = DHT.keyPair()

    const homeCom = await resetFederationTables(
      CONFIG.FEDERATE_COMMUNITY_NAME,
      `${CONFIG.FEDERATE_COMMUNITY_URL}:${CONFIG.FEDERATE_COMMUNITY_PORT}/`,
      CONFIG.COMMUNITY_DESCRIPTION,
      keyPair.publicKey,
      keyPair.secretKey,
    )
    logger.info(`my Federation HomeCommunity=${JSON.stringify(homeCom)}`)
    const node = new DHT({ keyPair })

    const server = node.createServer()

    server.on('connection', function (socket: any) {
      logger.info(`server.on...`)
      // noiseSocket is E2E between you and the other peer
      // pipe it somewhere like any duplex stream
      logger.info(`Remote public key: ${socket.remotePublicKey.toString('hex')}`)
      // console.log("Local public key", noiseSocket.publicKey.toString("hex")); // same as keyPair.publicKey

      socket.on('data', async (data: Buffer) => {
        logger.info(`data: ${data.toString('ascii')}`)
        const json = JSON.parse(data.toString('ascii'))
        if (json.api && json.url) {
          try {
            const newFed = await addFederationCommunity(socket.remotePublicKey, json.api, json.url)
            if (newFed) {
              logger.info(`new Remote-Community stored, start FederationHandshake...`)
              // no await for async function, because handshake runs async from the DHT federation
              startFederationHandshake(homeCom, socket.remotePublicKey)
            }
          } catch (err) {
            logger.error(err)
          }
        }
      })
      logger.info(`socket.on...`)

      // process.stdin.pipe(noiseSocket).pipe(process.stdout);
    })

    await server.listen(keyPair)
    logger.info(`server.listen...`)

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
          socket.write(Buffer.from(`{ "api" : "${homeCom.apiVersion}", "url" : "${homeCom.url}" }`))
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
