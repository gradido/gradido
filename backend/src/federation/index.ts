/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import DHT from '@hyperswarm/dht'
// import { Connection } from '@dbTools/typeorm'
import { backendLogger as logger } from '@/server/logger'
import { addFederationCommunity, resetFederationTables } from '@/dao/CommunityDAO'
import CONFIG from '../config'
import { startFederationHandshake, testKeyPairCryptography } from './control/HandshakeControler'
import { getSeed, uuidAsSeed } from '@/util/encryptionTools'

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

    const keyPairDHT = DHT.keyPair(getSeed())
    logger.debug(`keyPairDHT: publicKey=${keyPairDHT.publicKey.toString('hex')}`)
    logger.debug(`keyPairDHT: secretKey=${keyPairDHT.secretKey.toString('hex')}`)

    const homeCom = await resetFederationTables(
      CONFIG.FEDERATE_COMMUNITY_NAME,
      `${CONFIG.FEDERATE_COMMUNITY_URL}:${CONFIG.FEDERATE_COMMUNITY_PORT}/`,
      CONFIG.COMMUNITY_DESCRIPTION,
      keyPairDHT.publicKey,
      keyPairDHT.secretKey,
    )
    logger.info(`my Federation HomeCommunity=${JSON.stringify(homeCom)}`)
    const keyPairCom = {
      publicKey: homeCom.publicKey,
      secretKey: homeCom.privKey,
    }
    logger.debug(`Com.keyPair: JSON=${JSON.stringify(keyPairCom)}`)
    logger.debug(`DHT.keyPair: JSON=${JSON.stringify(keyPairDHT)}`)

    // await testKeyPairCryptography(homeCom, Buffer.from(keyPairCom.publicKey), Buffer.from(keyPairCom.secretKey))

    const node = new DHT({ keyPair: keyPairDHT })
    // const node = new DHT({ keyPairCom })

    const server = node.createServer()
    logger.debug(`server.adress: ${JSON.stringify(server.address())}`)

    server.on('connection', function (socket: any) {
      logger.info(`server.on...`)

      // noiseSocket is E2E between you and the other peer
      // pipe it somewhere like any duplex stream
      logger.debug(`Remote public key: ${socket.remotePublicKey.toString('hex')}`)
      logger.debug(`Local  public key: ${socket.publicKey.toString('hex')}`) // same as keyPair.publicKey

      socket.on('data', async (data: Buffer) => {
        logger.info(`data: ${data.toString('ascii')}`)
        const json = JSON.parse(data.toString('ascii'))
        if (json.api && json.url) {
          try {
            const startHandshake = await addFederationCommunity(
              socket.remotePublicKey,
              json.api,
              json.url,
            )
            logger.debug(`adding FederationCommunity successful...`)
            if (startHandshake) {
              logger.info(
                `remote Community exists in database and has to be verified per FederationHandshake...`,
              )
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

    await server.listen(keyPairDHT)

    logger.info(`server.listen...`)

    setInterval(async () => {
      logger.info(`Announcing on topic: ${TOPIC.toString('hex')}`)
      await node.announce(TOPIC, keyPairDHT).finished()
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
            pubKey !== keyPairDHT.publicKey &&
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
        logger.debug(`collectedPubKey        =${remotePubKey}`)
        logger.debug(`socket: pubKey         =${socket.publicKey.toString('hex')}`)
        logger.debug(`socket: remotepublicKey=${socket.remotePublicKey.toString('hex')}`)

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
