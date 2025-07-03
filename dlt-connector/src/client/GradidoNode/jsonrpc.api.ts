/* eslint-disable camelcase */
import { AddressType, ConfirmedTransaction, MemoryBlock, stringToAddressType } from 'gradido-blockchain-js'
import JsonRpcClient from 'jsonrpc-ts-client'
import { JsonRpcEitherResponse } from 'jsonrpc-ts-client/dist/types/utils/jsonrpc'

import { CONFIG } from '../../config'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import * as v from 'valibot'
import { confirmedTransactionFromBase64Schema } from '../../schemas/typeConverter.schema'
import { isPortOpenRetry } from '../../utils/network'
import { TransactionIdentifierInput, transactionIdentifierSchema } from '../../schemas/transaction.schema'
import { GradidoNodeErrorCodes } from '../../enum/GradidoNodeErrorCodes'
import { GetTransactionsInputType, TransactionFormatTypeInput, getTransactionsInputSchema, transactionFormatTypeSchema } from './input.schema'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.GradidoNode`)

const client = new JsonRpcClient({
  url: CONFIG.NODE_SERVER_URL,
})


interface ConfirmedTransactionList {
  transactions: string[]
  timeUsed: string
}

interface ConfirmedTransactionResponse {
  transaction: string
  timeUsed: string
}

interface AddressTypeResult {
  addressType: string
}

interface FindUserResponse {
  pubkey: string
  timeUsed: string
}

export class GradidoNodeRequestError<T> extends Error {
  private response?: JsonRpcEitherResponse<T>
  constructor(message: string, response?: JsonRpcEitherResponse<T>) {
    super(message)
    this.name = 'GradidoNodeRequestError'
    this.response = response
  }
  getResponse(): JsonRpcEitherResponse<T> | undefined {
    return this.response
  }
}

function resolveResponse<T, R>(response: JsonRpcEitherResponse<T>, onSuccess: (result: T) => R): R {
  if (response.isSuccess()) {
    return onSuccess(response.result)
  } else if (response.isError()) {
    throw new GradidoNodeRequestError(response.error.message, response)
  }
  throw new GradidoNodeRequestError('no success and no error')
}

async function getTransactions(input: GetTransactionsInputType): Promise<ConfirmedTransaction[]> {
  const parameter = v.parse(getTransactionsInputSchema, input)
  logger.debug('call getTransactions with ', parameter)
  await isPortOpenRetry(CONFIG.NODE_SERVER_URL)
  const response = await client.exec<ConfirmedTransactionList>('getTransactions', parameter)
  return resolveResponse(response, (result: ConfirmedTransactionList) => {
    logger.info(`call getTransactions, used ${result.timeUsed}`)
    return result.transactions.map((transactionBase64) =>
      v.parse(confirmedTransactionFromBase64Schema, transactionBase64),
    )
  })
}

async function getTransaction(
  transactionIdentifier: TransactionIdentifierInput, 
  format: TransactionFormatTypeInput
)
: Promise<ConfirmedTransaction | undefined> {
  const parameter = {
    ...v.parse(transactionIdentifierSchema, transactionIdentifier),
    format: v.parse(transactionFormatTypeSchema, format),
  }
  logger.debug('call gettransaction with ', parameter)
  await isPortOpenRetry(CONFIG.NODE_SERVER_URL)
  const response = await client.exec<ConfirmedTransactionResponse>('gettransaction', parameter)
  return resolveResponse(response, (result: ConfirmedTransactionResponse) => {
    logger.info(`call gettransaction, used ${result.timeUsed}`)
    return result.transaction && result.transaction !== ''
      ? v.parse(confirmedTransactionFromBase64Schema, result.transaction)
      : undefined
  })
}

async function getLastTransaction(iotaTopic: string): Promise<ConfirmedTransaction | undefined> {
  const parameter = {
    format: 'base64',
    communityId: iotaTopic,
  }
  logger.debug('call getlasttransaction with ', parameter)
  await isPortOpenRetry(CONFIG.NODE_SERVER_URL)
  const response = await client.exec<ConfirmedTransactionResponse>('getlasttransaction', parameter)
  return resolveResponse(response, (result: ConfirmedTransactionResponse) => {
    logger.info(`call getlasttransaction, used ${result.timeUsed}`)
    return result.transaction && result.transaction !== ''
      ? v.parse(confirmedTransactionFromBase64Schema, result.transaction)
      : undefined
  })
}

async function getAddressType(pubkey: Buffer, iotaTopic: string): Promise<AddressType | undefined> {
  const parameter = {
    pubkey: pubkey.toString('hex'),
    communityId: iotaTopic,
  }
  logger.debug('call getaddresstype with ', parameter)
  await isPortOpenRetry(CONFIG.NODE_SERVER_URL)
  const response = await client.exec<AddressTypeResult>('getaddresstype', parameter)
  return resolveResponse(response, (result: AddressTypeResult) => {
    logger.info(`call getaddresstype`)
    return stringToAddressType(result.addressType)
  })
}

async function findUserByNameHash(nameHash: MemoryBlock, iotaTopic: string): Promise<MemoryBlock | undefined> {
  const parameter = {
    nameHash: nameHash.convertToHex(),
    communityId: iotaTopic,
  }
  logger.debug('call findUserByNameHash with ', parameter)
  await isPortOpenRetry(CONFIG.NODE_SERVER_URL)
  const response = await client.exec<FindUserResponse>('findUserByNameHash', parameter)
  if (response.isError() && response.error.code === GradidoNodeErrorCodes.JSON_RPC_ERROR_ADDRESS_NOT_FOUND) {
    return undefined
  }
  return resolveResponse(response, (result: FindUserResponse) => {
    logger.info(`call findUserByNameHash, used ${result.timeUsed}`)
    return result.pubkey && result.pubkey !== '' ? MemoryBlock.fromHex(result.pubkey) : undefined
  })
}

async function getTransactionsForAccount(
  pubkey: MemoryBlock,
  iotaTopic: string,
  maxResultCount = 0,
  firstTransactionNr = 1,
): Promise<ConfirmedTransaction[] | undefined> {
  const parameter = {
    pubkey: pubkey.convertToHex(),
    format: 'base64',
    firstTransactionNr,
    maxResultCount,
    communityId: iotaTopic,
  }
  logger.debug('call listtransactionsforaddress with ', parameter)
  await isPortOpenRetry(CONFIG.NODE_SERVER_URL)
  const response = await client.exec<ConfirmedTransactionList>('listtransactionsforaddress', parameter)
  return resolveResponse(response, (result: ConfirmedTransactionList) => {
    logger.info(`call listtransactionsforaddress, used ${result.timeUsed}`)
    return result.transactions.map((transactionBase64) =>
      v.parse(confirmedTransactionFromBase64Schema, transactionBase64),
    )
  })
}

export {
  getTransaction,
  getLastTransaction,
  getTransactions,
  getAddressType,
  getTransactionsForAccount,
  findUserByNameHash,
}
