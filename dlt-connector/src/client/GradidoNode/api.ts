import { AddressType, ConfirmedTransaction } from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { Uuidv4Hash } from '../../data/Uuidv4Hash'
import { GradidoNodeErrorCodes } from '../../enum/GradidoNodeErrorCodes'
import { addressTypeSchema, confirmedTransactionSchema } from '../../schemas/typeConverter.schema'
import { Hex32, Hex32Input, HieroId, hex32Schema } from '../../schemas/typeGuard.schema'
import {
  TransactionIdentifierInput,
  TransactionsRangeInput,
  transactionIdentifierSchema,
  transactionsRangeSchema,
} from './input.schema'
import { GradidoNodeRequestError, rpcCall, rpcCallResolved } from './jsonrpc'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.GradidoNode`)

/**
 * getTransactions
 * get list of confirmed transactions from a specific community
 * @param input fromTransactionId is the id of the first transaction to return
 * @param input maxResultCount is the max number of transactions to return
 * @param input topic is the community hiero topic id
 * @returns list of confirmed transactions
 * @throws GradidoNodeRequestError
 * @example
 * ```
 * const transactions = await getTransactions({
 *   fromTransactionId: 1,
 *   maxResultCount: 100,
 *   topic: communityUuid,
 * })
 * ```
 */
async function getTransactions(input: TransactionsRangeInput): Promise<ConfirmedTransaction[]> {
  const parameter = { ...v.parse(transactionsRangeSchema, input), format: 'base64' }
  const result = await rpcCallResolved<{ transactions: string[] }>('getTransactions', parameter)
  return result.transactions.map((transactionBase64) =>
    v.parse(confirmedTransactionSchema, transactionBase64),
  )
}

/**
 * getTransaction
 * get a specific confirmed transaction from a specific community
 * @param transactionIdentifier
 * @returns the confirmed transaction or undefined if transaction is not found
 * @throws GradidoNodeRequestError
 */
async function getTransaction(
  transactionIdentifier: TransactionIdentifierInput,
): Promise<ConfirmedTransaction | undefined> {
  const parameter = {
    ...v.parse(transactionIdentifierSchema, transactionIdentifier),
    format: 'base64',
  }
  const response = await rpcCall<{ transaction: string }>('gettransaction', parameter)
  if (response.isSuccess()) {
    return v.parse(confirmedTransactionSchema, response.result.transaction)
  }
  if (response.isError()) {
    if (response.error.code === GradidoNodeErrorCodes.TRANSACTION_NOT_FOUND) {
      return undefined
    }
  }
  throw new GradidoNodeRequestError(response.error.message, response)
}

/**
 * getLastTransaction
 * get the last confirmed transaction from a specific community
 * @param iotaTopic the community topic
 * @returns the last confirmed transaction or undefined if blockchain for community is empty or not found
 * @throws GradidoNodeRequestError
 */

async function getLastTransaction(
  iotaTopic: Uuidv4Hash,
): Promise<ConfirmedTransaction | undefined> {
  const response = await rpcCall<{ transaction: string }>('getlasttransaction', {
    format: 'base64',
    topic: iotaTopic.getAsHexString(),
  })
  if (response.isSuccess()) {
    return v.parse(confirmedTransactionSchema, response.result.transaction)
  }
  if (response.isError()) {
    if (response.error.code === GradidoNodeErrorCodes.GRADIDO_NODE_ERROR) {
      return undefined
    }
    throw new GradidoNodeRequestError(response.error.message, response)
  }
}

/**
 * getAddressType
 * get the address type of a specific user
 * can be used to check if user/account exists on blockchain
 * look also for gmw, auf and deferred transfer accounts
 * @param pubkey the public key of the user or account
 * @param iotaTopic the community topic
 * @returns the address type of the user/account or undefined
 * @throws GradidoNodeRequestError
 */

async function getAddressType(pubkey: Hex32Input, hieroTopic: HieroId): Promise<AddressType> {
  const parameter = {
    pubkey: v.parse(hex32Schema, pubkey),
    communityId: hieroTopic,
  }
  const response = await rpcCallResolved<{ addressType: string }>('getaddresstype', parameter)
  return v.parse(addressTypeSchema, response.addressType)
}

/**
 * findUserByNameHash
 * find a user by name hash
 * @param nameHash the name hash of the user
 * @param iotaTopic the community topic
 * @returns the public key of the user as hex32 string or undefined if user is not found
 * @throws GradidoNodeRequestError
 */
async function findUserByNameHash(
  nameHash: Uuidv4Hash,
  hieroTopic: HieroId,
): Promise<Hex32 | undefined> {
  const parameter = {
    nameHash: nameHash.getAsHexString(),
    communityId: hieroTopic,
  }
  const response = await rpcCall<{ pubkey: string; timeUsed: string }>(
    'findUserByNameHash',
    parameter,
  )
  if (response.isSuccess()) {
    logger.info(`call findUserByNameHash, used ${response.result.timeUsed}`)
    return v.parse(hex32Schema, response.result.pubkey)
  }
  if (
    response.isError() &&
    response.error.code === GradidoNodeErrorCodes.JSON_RPC_ERROR_ADDRESS_NOT_FOUND
  ) {
    logger.debug(`call findUserByNameHash, return with error: ${response.error.message}`)
  }
  return undefined
}

/**
 * getTransactionsForAccount
 * get list of confirmed transactions for a specific account
 * @param transactionRange the range of transactions to return
 * @param pubkey the public key of the account
 * @returns list of confirmed transactions
 * @throws GradidoNodeRequestError
 */
async function getTransactionsForAccount(
  transactionRange: TransactionsRangeInput,
  pubkey: Hex32Input,
): Promise<ConfirmedTransaction[]> {
  const parameter = {
    ...v.parse(transactionsRangeSchema, transactionRange),
    pubkey: v.parse(hex32Schema, pubkey),
    format: 'base64',
  }
  const response = await rpcCallResolved<{ transactions: string[] }>(
    'listtransactionsforaddress',
    parameter,
  )
  return response.transactions.map((transactionBase64) =>
    v.parse(confirmedTransactionSchema, transactionBase64),
  )
}

export {
  getTransaction,
  getLastTransaction,
  getTransactions,
  getAddressType,
  getTransactionsForAccount,
  findUserByNameHash,
}
