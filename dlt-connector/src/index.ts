import { readFileSync } from 'node:fs'
import { Elysia } from 'elysia'
import { loadCryptoKeys, MemoryBlock } from 'gradido-blockchain-js'
import { configure, getLogger, Logger } from 'log4js'
import * as v from 'valibot'
import { KeyPairCacheManager } from './cache/KeyPairCacheManager'
import { BackendClient } from './client/backend/BackendClient'
import { GradidoNodeClient } from './client/GradidoNode/GradidoNodeClient'
import { HieroClient } from './client/hiero/HieroClient'
import { CONFIG } from './config'
import { MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_UPDATE } from './config/const'
import { SendToHieroContext } from './interactions/sendToHiero/SendToHiero.context'
import { Community, communitySchema } from './schemas/transaction.schema'
import { appRoutes } from './server'
import { isPortOpenRetry } from './utils/network'

type Clients = {
  backend: BackendClient
  hiero: HieroClient
  gradidoNode: GradidoNodeClient
}

async function main() {
  // load everything from .env
  const logger = loadConfig()
  const clients = createClients()
  const { hiero, gradidoNode } = clients

  // show hiero account balance, double also as check if valid hiero account was given in config
  const balance = await hiero.getBalance()
  logger.info(`Hiero Account Balance: ${balance.hbars.toString()}`)

  // get home community, create topic if not exist, or check topic expiration and update it if needed
  const homeCommunity = await homeCommunitySetup(clients, logger)

  // ask gradido node if community blockchain was created
  try {
    if (
      !(await gradidoNode.getTransaction({ transactionId: 1, topic: homeCommunity.hieroTopicId }))
    ) {
      // if not exist, create community root transaction
      await SendToHieroContext(homeCommunity)
    }
  } catch (e) {
    logger.error(`error requesting gradido node: ${e}`)
  }
  // listen for rpc request from backend (graphql replaced with elysiaJS)
  new Elysia().use(appRoutes).listen(CONFIG.DLT_CONNECTOR_PORT, () => {
    logger.info(`Server is running at http://localhost:${CONFIG.DLT_CONNECTOR_PORT}`)
    setupGracefulShutdown(logger)
  })
}

function setupGracefulShutdown(logger: Logger) {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  signals.forEach((sig) => {
    process.on(sig, async () => {
      logger.info(`[shutdown] Got ${sig}, cleaning up…`)
      await gracefulShutdown(logger)
      process.exit(0)
    })
  })

  if (process.platform === 'win32') {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.on('SIGINT', () => {
      process.emit('SIGINT' as any)
    })
  }
}

async function gracefulShutdown(logger: Logger) {
  logger.info('graceful shutdown')
  await HieroClient.getInstance().waitForPendingPromises()
}

function loadConfig(): Logger {
  // configure log4js
  // TODO: replace late by loader from config-schema
  const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))
  configure(options)
  const logger = getLogger('dlt')

  // load crypto keys for gradido blockchain lib
  loadCryptoKeys(
    MemoryBlock.fromHex(CONFIG.GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET),
    MemoryBlock.fromHex(CONFIG.GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY),
  )
  return logger
}

// needed to be called after loading config
function createClients(): Clients {
  return {
    backend: BackendClient.getInstance(),
    hiero: HieroClient.getInstance(),
    gradidoNode: GradidoNodeClient.getInstance(),
  }
}

async function homeCommunitySetup({ backend, hiero }: Clients, logger: Logger): Promise<Community> {
  // wait for backend server
  await isPortOpenRetry(CONFIG.BACKEND_SERVER_URL)
  // ask backend for home community
  let homeCommunity = await backend.getHomeCommunityDraft()
  // on missing topicId, create one
  if (!homeCommunity.hieroTopicId) {
    const topicId = await hiero.createTopic(homeCommunity.name)
    // update topic on backend server
    homeCommunity = await backend.setHomeCommunityTopicId(homeCommunity.uuid, topicId)
  } else {
    // if topic exist, check if we need to update it
    let topicInfo = await hiero.getTopicInfo(homeCommunity.hieroTopicId)
    // console.log(`topicInfo: ${JSON.stringify(topicInfo, null, 2)}`)
    if (
      topicInfo.expirationTime.getTime() - new Date().getTime() <
      MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_UPDATE
    ) {
      await hiero.updateTopic(homeCommunity.hieroTopicId)
      topicInfo = await hiero.getTopicInfo(homeCommunity.hieroTopicId)
      logger.info(
        `updated topic info, new expiration time: ${topicInfo.expirationTime.toLocaleDateString()}`,
      )
    }
  }
  if (!homeCommunity.hieroTopicId) {
    throw new Error('still no topic id, after creating topic and update community in backend.')
  }
  KeyPairCacheManager.getInstance().setHomeCommunityTopicId(homeCommunity.hieroTopicId)
  logger.info(`home community topic: ${homeCommunity.hieroTopicId}`)
  logger.info(`gradido node server: ${CONFIG.NODE_SERVER_URL}`)
  logger.info(`gradido backend server: ${CONFIG.BACKEND_SERVER_URL}`)
  return v.parse(communitySchema, homeCommunity)
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  process.exit(1)
})
