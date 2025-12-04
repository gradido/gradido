import {
  Community as DbCommunity,
  Contribution as DbContribution,
  DltTransaction as DbDltTransaction,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  getCommunityByUuid,
  getHomeCommunity,
  getUserById,
  UserLoggingView,
} from 'database'
import { getLogger } from 'log4js'
import { IRestResponse } from 'typed-rest-client'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { DltConnectorClient } from './DltConnectorClient'
import { DltTransactionType } from './enum/DltTransactionType'
import { TransactionDraft } from './model/TransactionDraft'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.dltConnector`)
// will be undefined if dlt connect is disabled
const dltConnectorClient = DltConnectorClient.getInstance()

async function checkDltConnectorResult(
  dltTransaction: DbDltTransaction,
  clientResponse: Promise<IRestResponse<{ transactionId: string }>>,
): Promise<DbDltTransaction> {
  // check result from dlt connector
  try {
    const response = await clientResponse
    if (response.statusCode === 200 && response.result) {
      dltTransaction.messageId = response.result.transactionId
    } else {
      dltTransaction.error = `empty result with status code ${response.statusCode}`
      logger.error('error from dlt-connector', response)
    }
  } catch (e) {
    logger.debug(e)
    if (e instanceof Error) {
      dltTransaction.error = e.message
      logger.error('Error from dlt-connector', e)
    } else if (typeof e === 'string') {
      dltTransaction.error = e
      logger.error('error from dlt-connector', e)
    } else {
      throw e
    }
  }
  return dltTransaction
}

async function executeDltTransaction(
  draft: TransactionDraft | null,
  typeId: DltTransactionType,
  persist = true,
): Promise<DbDltTransaction | null> {
  if (draft && dltConnectorClient) {
    const clientResponse = dltConnectorClient.sendTransaction(draft)
    let dltTransaction = new DbDltTransaction()
    dltTransaction.typeId = typeId
    dltTransaction = await checkDltConnectorResult(dltTransaction, clientResponse)
    if (persist) {
      return await dltTransaction.save()
    }
    return dltTransaction
  }
  return Promise.resolve(null)
}

/**
 * send register address transaction via dlt-connector to hiero
 * and update dltTransactionId of transaction in db with hiero transaction id
 */
export async function registerAddressTransaction(
  user: DbUser,
  community: DbCommunity,
): Promise<DbDltTransaction | null> {
  if (!CONFIG.DLT_ACTIVE) {
    return Promise.resolve(null)
  }
  if (!user.id) {
    logger.error(
      `missing id for user: ${user.gradidoID}, please call registerAddressTransaction after user.save()`,
    )
    return null
  }
  // return null if some data where missing and log error
  const draft = TransactionDraft.createRegisterAddress(user, community)
  const dltTransaction = await executeDltTransaction(
    draft,
    DltTransactionType.REGISTER_ADDRESS,
    false,
  )
  if (dltTransaction) {
    if (user.id) {
      dltTransaction.userId = user.id
    }
    return await dltTransaction.save()
  }
  return null
}

export async function contributionTransaction(
  contribution: DbContribution,
  signingUser: DbUser,
  createdAt: Date,
): Promise<DbDltTransaction | null> {
  if (!CONFIG.DLT_ACTIVE) {
    return Promise.resolve(null)
  }
  const homeCommunity = await getHomeCommunity()
  if (!homeCommunity) {
    logger.error('home community not found')
    return null
  }
  const draft = TransactionDraft.createContribution(
    contribution,
    createdAt,
    signingUser,
    homeCommunity,
  )
  return await executeDltTransaction(draft, DltTransactionType.CREATION)
}

export async function transferTransaction(
  senderUser: DbUser,
  recipientUser: DbUser,
  amount: string,
  memo: string,
  createdAt: Date,
): Promise<DbDltTransaction | null> {
  if (!CONFIG.DLT_ACTIVE) {
    return Promise.resolve(null)
  }
  // load community if not already loaded, maybe they are remote communities
  if (!senderUser.community) {
    senderUser.community = await getCommunityByUuid(senderUser.communityUuid)
  }
  if (!recipientUser.community) {
    recipientUser.community = await getCommunityByUuid(recipientUser.communityUuid)
  }
  logger.info(`sender user: ${new UserLoggingView(senderUser)}`)
  logger.info(`recipient user: ${new UserLoggingView(recipientUser)}`)
  const draft = TransactionDraft.createTransfer(senderUser, recipientUser, amount, memo, createdAt)
  return await executeDltTransaction(draft, DltTransactionType.TRANSFER)
}

export async function deferredTransferTransaction(
  senderUser: DbUser,
  transactionLink: DbTransactionLink,
): Promise<DbDltTransaction | null> {
  if (!CONFIG.DLT_ACTIVE) {
    return Promise.resolve(null)
  }
  // load community if not already loaded
  if (!senderUser.community) {
    senderUser.community = await getCommunityByUuid(senderUser.communityUuid)
  }
  const draft = TransactionDraft.createDeferredTransfer(senderUser, transactionLink)
  return await executeDltTransaction(draft, DltTransactionType.DEFERRED_TRANSFER)
}

export async function redeemDeferredTransferTransaction(
  transactionLink: DbTransactionLink,
  amount: string,
  createdAt: Date,
  recipientUser: DbUser,
): Promise<DbDltTransaction | null> {
  if (!CONFIG.DLT_ACTIVE) {
    return Promise.resolve(null)
  }
  // load user and communities if not already loaded
  if (!transactionLink.user) {
    logger.debug('load sender user')
    transactionLink.user = await getUserById(transactionLink.userId, true, false)
  }
  if (!transactionLink.user.community) {
    logger.debug('load sender community')
    transactionLink.user.community = await getCommunityByUuid(transactionLink.user.communityUuid)
  }
  if (!recipientUser.community) {
    logger.debug('load recipient community')
    recipientUser.community = await getCommunityByUuid(recipientUser.communityUuid)
  }
  logger.debug(`sender: ${new UserLoggingView(transactionLink.user)}`)
  logger.debug(`recipient: ${new UserLoggingView(recipientUser)}`)
  const draft = TransactionDraft.redeemDeferredTransfer(
    transactionLink,
    amount,
    createdAt,
    recipientUser,
  )
  return await executeDltTransaction(draft, DltTransactionType.REDEEM_DEFERRED_TRANSFER)
}
