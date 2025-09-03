import { readFileSync } from 'node:fs'
import { Elysia } from 'elysia'
import { loadCryptoKeys, MemoryBlock } from 'gradido-blockchain-js'
import { configure, getLogger } from 'log4js'
import * as v from 'valibot'
import { BackendClient } from './client/backend/BackendClient'
import { HieroClient } from './client/hiero/HieroClient'
import { getTransaction } from './client/GradidoNode/api'
import { CONFIG } from './config'
import { SendToIotaContext } from './interactions/sendToIota/SendToIota.context'
import { KeyPairCacheManager } from './KeyPairCacheManager'
import { keyGenerationSeedSchema } from './schemas/base.schema'
import { isPortOpenRetry } from './utils/network'
import { appRoutes } from './server'
import { MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_UPDATE } from './config/const'

async function main() {
  // configure log4js
  // TODO: replace late by loader from config-schema
  const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))
  configure(options)
  const logger = getLogger('dlt')
  // check if valid seed for root key pair generation is present
  if (!v.safeParse(keyGenerationSeedSchema, CONFIG.IOTA_HOME_COMMUNITY_SEED).success) {
    logger.error('IOTA_HOME_COMMUNITY_SEED must be a valid hex string, at least 64 characters long')
    process.exit(1)
  }

  // load crypto keys for gradido blockchain lib
  loadCryptoKeys(
    MemoryBlock.fromHex(CONFIG.GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET),
    MemoryBlock.fromHex(CONFIG.GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY),
  )

  // ask backend for home community if we haven't one
  const backend = BackendClient.getInstance()
  if (!backend) {
    throw new Error('cannot create backend client')
  }
  const hieroClient = HieroClient.getInstance()
  if (!hieroClient) {
    throw new Error('cannot create hiero client')
  }
  // wait for backend server
  await isPortOpenRetry(CONFIG.BACKEND_SERVER_URL)
  let homeCommunity = await backend.getHomeCommunityDraft()
  // on missing topicId, create one
  if (!homeCommunity.topicId) {
    const topicId = await hieroClient.createTopic()
    homeCommunity = await backend.setHomeCommunityTopicId(homeCommunity.uuid, topicId)
  } else {
    // if topic exist, check if we need to update it
    let topicInfo = await hieroClient.getTopicInfo(homeCommunity.topicId)
    if (topicInfo.expirationTime.getTime() - new Date().getTime() < MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_UPDATE) {
      await hieroClient.updateTopic(homeCommunity.topicId)
      topicInfo = await hieroClient.getTopicInfo(homeCommunity.topicId)
      logger.info('updated topic info, new expiration time: %s', topicInfo.expirationTime.toLocaleDateString())
    }
  }
  if (!homeCommunity.topicId) {
    throw new Error('still no topic id, after creating topic and update community in backend.')
  }
  KeyPairCacheManager.getInstance().setHomeCommunityTopicId(homeCommunity.topicId)
  logger.info('home community topic: %s', homeCommunity.topicId)
  logger.info('gradido node server: %s', CONFIG.NODE_SERVER_URL)
  // ask gradido node if community blockchain was created
  try {
    if (!(await getTransaction({ transactionNr: 1, topic: homeCommunity.topicId }))) {
      // if not exist, create community root transaction
      await SendToIotaContext(homeCommunity)
    }
  } catch (e) {
    logger.error('error requesting gradido node: ', e)
  }
  // listen for rpc request from backend (graphql replaced with trpc and elysia)
  new Elysia()
    .use(appRoutes)
    .listen(CONFIG.DLT_CONNECTOR_PORT, () => {
      logger.info(`Server is running at http://localhost:${CONFIG.DLT_CONNECTOR_PORT}`)
    })
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  process.exit(1)
})
