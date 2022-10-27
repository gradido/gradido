/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import DHT from '@hyperswarm/dht'
import { Connection } from '@dbTools/typeorm'

function between(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const POLLTIME = 20000
const SUCCESSTIME = 120000
const ERRORTIME = 240000
const ANNOUNCETIME = 30000
const nodeRand = between(1, 99)
const nodeURL = `https://test${nodeRand}.org`
const nodeAPI = {
  API_1_00: `${nodeURL}/api/1_00/`,
  API_1_01: `${nodeURL}/api/1_01/`,
  API_2_00: `${nodeURL}/graphql/2_00/`,
}

export const startDHT = async (connection: Connection, topic: string): Promise<void> => {
  try {
    console.log('topic', topic, typeof topic)

    const TOPIC = DHT.hash(Buffer.from(topic))

    const keyPair = DHT.keyPair()

    const node = new DHT({ keyPair })

    const server = node.createServer()

    server.on('connection', function (socket: any) {
      // noiseSocket is E2E between you and the other peer
      // pipe it somewhere like any duplex stream
      console.log('Remote public key', socket.remotePublicKey.toString('hex'))
      // console.log("Local public key", noiseSocket.publicKey.toString("hex")); // same as keyPair.publicKey

      socket.on('data', (data: Buffer) => console.log('data:', data.toString('ascii')))

      // process.stdin.pipe(noiseSocket).pipe(process.stdout);
    })

    await server.listen()

    setInterval(async () => {
      console.log('Announcing on topic:', TOPIC.toString('hex'))
      await node.announce(TOPIC, keyPair).finished()
    }, ANNOUNCETIME)

    let successfulRequests: string[] = []
    let errorfulRequests: string[] = []

    setInterval(async () => {
      console.log('Refreshing successful nodes')
      successfulRequests = []
    }, SUCCESSTIME)

    setInterval(async () => {
      console.log('Refreshing errorful nodes')
      errorfulRequests = []
    }, ERRORTIME)

    setInterval(async () => {
      const result = await node.lookup(TOPIC)

      const collectedPubKeys: string[] = []

      for await (const data of result) {
        /* console.log(
           `${data.from.host}:${data.from.port}: peers: ${data.peers.length}`
           ); */
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

      console.log('Found new peers: ', collectedPubKeys)

      collectedPubKeys.forEach((remotePubKey) => {
        // publicKey here is keyPair.publicKey from above
        const socket = node.connect(Buffer.from(remotePubKey, 'hex'))

        /* socket.once("connect", function () {
           console.log("client side emitted connect");
           }); */

        /* socket.once("end", function () {
           console.log("client side ended");
           }); */

        socket.once('error', (err: any) => {
          errorfulRequests.push(remotePubKey)
          console.log(`error on peer ${remotePubKey}: ${err.message}`)
        })

        socket.on('open', function () {
          // noiseSocket fully open with the other peer
          // console.log("writing to socket");
          socket.write(Buffer.from(`${nodeRand}`))
          socket.write(Buffer.from(JSON.stringify(nodeAPI)))
          successfulRequests.push(remotePubKey)
        })
        // pipe it somewhere like any duplex stream
        // process.stdin.pipe(noiseSocket).pipe(process.stdout)
      })
    }, POLLTIME)
  } catch (err) {
    console.log(err)
  }
}
