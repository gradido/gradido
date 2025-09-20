import { IRestResponse } from 'typed-rest-client'
import { DltTransactionType } from './enum/DltTransactionType'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { DltConnectorClient } from './DltConnectorClient'
import { 
  Community as DbCommunity, 
  Contribution as DbContribution,
  DltTransaction as DbDltTransaction, 
  User as DbUser,
  getHomeCommunity,   
} from 'database'
import { TransactionDraft } from './model/TransactionDraft'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.dltConnector`)
// will be undefined if dlt connect is disabled
const dltConnectorClient = DltConnectorClient.getInstance()

async function checkDltConnectorResult(dltTransaction: DbDltTransaction, clientResponse: Promise<IRestResponse<{ transactionId: string }>>)
 : Promise<DbDltTransaction> {
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
    } else if (typeof e === 'string') {
      dltTransaction.error = e
    } else {
      throw e
    }
  }
  return dltTransaction
}

/**
 * send register address transaction via dlt-connector to hiero
 * and update dltTransactionId of transaction in db with hiero transaction id 
 */
export async function registerAddressTransaction(user: DbUser, community: DbCommunity): Promise<DbDltTransaction | null> {
  if (!user.id) {
    logger.error(`missing id for user: ${user.gradidoID}, please call registerAddressTransaction after user.save()`)
    return null
  }
  // return null if some data where missing and log error
  const draft = TransactionDraft.createRegisterAddress(user, community)
  if (draft && dltConnectorClient) {
    const clientResponse = dltConnectorClient.sendTransaction(draft)
    let dltTransaction = new DbDltTransaction()
    dltTransaction.typeId = DltTransactionType.REGISTER_ADDRESS
    if (user.id) {
      dltTransaction.userId = user.id
    }
    dltTransaction = await checkDltConnectorResult(dltTransaction, clientResponse)
    return await dltTransaction.save()
  } 
  return null   
}

export async function contributionTransaction(
  contribution: DbContribution, 
  signingUser: DbUser,
  createdAt: Date,
): Promise<DbDltTransaction | null> {
  const homeCommunity = await getHomeCommunity()
  if (!homeCommunity) {
    logger.error('home community not found')
    return null
  }
  const draft = TransactionDraft.createContribution(contribution, createdAt, signingUser, homeCommunity)
  if (draft && dltConnectorClient) {
    const clientResponse = dltConnectorClient.sendTransaction(draft)
    let dltTransaction = new DbDltTransaction()
    dltTransaction.typeId = DltTransactionType.CREATION
    dltTransaction = await checkDltConnectorResult(dltTransaction, clientResponse)
    return await dltTransaction.save()
  } 
  return null   
}

export async function transferTransaction(
  senderUser: DbUser, 
  recipientUser: DbUser, 
  amount: string, 
  memo: string, 
  createdAt: Date
): Promise<DbDltTransaction | null> {

  const draft = TransactionDraft.createTransfer(senderUser, recipientUser, amount, memo, createdAt)
  if (draft && dltConnectorClient) {
    const clientResponse = dltConnectorClient.sendTransaction(draft)
    let dltTransaction = new DbDltTransaction()
    dltTransaction.typeId = DltTransactionType.TRANSFER
    dltTransaction = await checkDltConnectorResult(dltTransaction, clientResponse)
    return await dltTransaction.save()
  } 
  return null   
}


