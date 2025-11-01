import { readFileSync } from 'node:fs'
import { loadCryptoKeys, MemoryBlock } from 'gradido-blockchain-js'
import { configure, getLogger, Logger } from 'log4js'
import * as v from 'valibot'
import { CONFIG } from '../config'
import { MIN_TOPIC_EXPIRE_MILLISECONDS_FOR_UPDATE } from '../config/const'
import { SendToHieroContext } from '../interactions/sendToHiero/SendToHiero.context'
import { Community, communitySchema } from '../schemas/transaction.schema'
import { isPortOpenRetry } from '../utils/network'
import { type AppContext, type AppContextClients } from './appContext'
import { initGradidoNode } from './initGradidoNode'

export function loadConfig(): Logger {
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

export async function checkHieroAccount(logger: Logger, clients: AppContextClients): Promise<void> {
  const balance = await clients.hiero.getBalance()
  logger.info(`Hiero Account Balance: ${balance.hbars.toString()}`)
}

export async function checkHomeCommunity(
  appContext: AppContext,
  logger: Logger,
): Promise<Community> {
  const { backend, hiero } = appContext.clients

  // wait for backend server
  await isPortOpenRetry(backend.url)
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
  appContext.cache.setHomeCommunityTopicId(homeCommunity.hieroTopicId)
  logger.info(`home community topic: ${homeCommunity.hieroTopicId}`)
  logger.info(`gradido node server: ${appContext.clients.gradidoNode.url}`)
  logger.info(`gradido backend server: ${appContext.clients.backend.url}`)
  return v.parse(communitySchema, homeCommunity)
}

export async function checkGradidoNode(
  clients: AppContextClients,
  logger: Logger,
  homeCommunity: Community,
): Promise<void> {
  // check if gradido node is running, if not setup and start it
  await initGradidoNode(clients)

  // ask gradido node if community blockchain was created
  try {
    if (
      !(await clients.gradidoNode.getTransaction({
        transactionId: 1,
        topic: homeCommunity.hieroTopicId,
      }))
    ) {
      // if not exist, create community root transaction
      await SendToHieroContext(homeCommunity)
    }
  } catch (e) {
    logger.error(`error requesting gradido node: ${e}`)
  }
}
