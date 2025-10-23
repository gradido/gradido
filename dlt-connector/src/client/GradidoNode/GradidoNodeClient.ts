import { ConfirmedTransaction } from 'gradido-blockchain-js'
import JsonRpcClient from 'jsonrpc-ts-client'
import { JsonRpcEitherResponse } from 'jsonrpc-ts-client/dist/types/utils/jsonrpc'
import { getLogger, Logger } from 'log4js'
import * as v from 'valibot'
import { CONFIG } from '../../config'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { AddressType } from '../../data/AddressType.enum'
import { Uuidv4Hash } from '../../data/Uuidv4Hash'
import { addressTypeSchema, confirmedTransactionSchema } from '../../schemas/typeConverter.schema'
import { Hex32, Hex32Input, HieroId, hex32Schema } from '../../schemas/typeGuard.schema'
import { isPortOpenRetry } from '../../utils/network'
import { GradidoNodeErrorCodes } from './GradidoNodeErrorCodes'
import {
  TransactionIdentifierInput,
  TransactionsRangeInput,
  transactionIdentifierSchema,
  transactionsRangeSchema,
} from './input.schema'

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

type WithTimeUsed<T> = T & { timeUsed?: string }

export class GradidoNodeClient {
  private static instance: GradidoNodeClient
  client: JsonRpcClient
  logger: Logger
  urlValue: string

  private constructor() {
    this.logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.GradidoNodeClient`)
    this.urlValue = `http://localhost:${CONFIG.DLT_NODE_SERVER_PORT}`
    this.logger.addContext('url', this.urlValue)
    this.client = new JsonRpcClient({
      url: this.urlValue,
    })
  }

  public get url(): string {
    return this.urlValue
  }

  public static getInstance(): GradidoNodeClient {
    if (!GradidoNodeClient.instance) {
      GradidoNodeClient.instance = new GradidoNodeClient()
    }
    return GradidoNodeClient.instance
  }

  /**
   * getTransaction
   * get a specific confirmed transaction from a specific community
   * @param transactionIdentifier
   * @returns the confirmed transaction or undefined if transaction is not found
   * @throws GradidoNodeRequestError
   */
  public async getTransaction(
    transactionIdentifier: TransactionIdentifierInput,
  ): Promise<ConfirmedTransaction | undefined> {
    const parameter = {
      ...v.parse(transactionIdentifierSchema, transactionIdentifier),
      format: 'base64',
    }
    const response = await this.rpcCall<{ transaction: string }>('getTransaction', parameter)
    if (response.isSuccess()) {
      // this.logger.debug('result: ', response.result.transaction)
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
   * @param hieroTopic the community hiero topic id
   * @returns the last confirmed transaction or undefined if blockchain for community is empty or not found
   * @throws GradidoNodeRequestError
   */

  public async getLastTransaction(hieroTopic: HieroId): Promise<ConfirmedTransaction | undefined> {
    const parameter = {
      format: 'base64',
      topic: hieroTopic,
    }
    const response = await this.rpcCall<{ transaction: string }>('getLastTransaction', parameter)
    if (response.isSuccess()) {
      return v.parse(confirmedTransactionSchema, response.result.transaction)
    }
    if (response.isError()) {
      if (response.error.code === GradidoNodeErrorCodes.GRADIDO_NODE_ERROR) {
        return undefined
      }
    }
    throw new GradidoNodeRequestError(response.error.message, response)
  }

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
  public async getTransactions(input: TransactionsRangeInput): Promise<ConfirmedTransaction[]> {
    const parameter = {
      ...v.parse(transactionsRangeSchema, input),
      format: 'base64',
    }
    const result = await this.rpcCallResolved<{ transactions: string[] }>(
      'getTransactions',
      parameter,
    )
    return result.transactions.map((transactionBase64) =>
      v.parse(confirmedTransactionSchema, transactionBase64),
    )
  }

  /**
   * getTransactionsForAccount
   * get list of confirmed transactions for a specific account
   * @param transactionRange the range of transactions to return
   * @param pubkey the public key of the account
   * @returns list of confirmed transactions
   * @throws GradidoNodeRequestError
   */
  public async getTransactionsForAccount(
    transactionRange: TransactionsRangeInput,
    pubkey: Hex32Input,
  ): Promise<ConfirmedTransaction[]> {
    const parameter = {
      ...v.parse(transactionsRangeSchema, transactionRange),
      pubkey: v.parse(hex32Schema, pubkey),
      format: 'base64',
    }
    const response = await this.rpcCallResolved<{ transactions: string[] }>(
      'getTransactionsForAddress',
      parameter,
    )
    return response.transactions.map((transactionBase64) =>
      v.parse(confirmedTransactionSchema, transactionBase64),
    )
  }

  /**
   * getAddressType
   * get the address type of a specific user
   * can be used to check if user/account exists on blockchain
   * look also for gmw, auf and deferred transfer accounts
   * @param pubkey the public key of the user or account
   * @param hieroTopic the community hiero topic id
   * @returns the address type of the user/account, AddressType.NONE if not found
   * @throws GradidoNodeRequestError
   */

  public async getAddressType(pubkey: Hex32Input, hieroTopic: HieroId): Promise<AddressType> {
    const parameter = {
      pubkey: v.parse(hex32Schema, pubkey),
      topic: hieroTopic,
    }
    const response = await this.rpcCallResolved<{ addressType: string }>(
      'getAddressType',
      parameter,
    )
    return v.parse(addressTypeSchema, response.addressType)
  }

  /**
   * findUserByNameHash
   * find a user by name hash
   * @param nameHash the name hash of the user
   * @param hieroTopic the community hiero topic id
   * @returns the public key of the user as hex32 string or undefined if user is not found
   * @throws GradidoNodeRequestError
   */
  public async findUserByNameHash(
    nameHash: Uuidv4Hash,
    hieroTopic: HieroId,
  ): Promise<Hex32 | undefined> {
    const parameter = {
      nameHash: nameHash.getAsHexString(),
      topic: hieroTopic,
    }
    const response = await this.rpcCall<{ pubkey: string; timeUsed: string }>(
      'findUserByNameHash',
      parameter,
    )
    if (response.isSuccess()) {
      this.logger.info(`call findUserByNameHash, used ${response.result.timeUsed}`)
      return v.parse(hex32Schema, response.result.pubkey)
    }
    if (
      response.isError() &&
      response.error.code === GradidoNodeErrorCodes.JSON_RPC_ERROR_ADDRESS_NOT_FOUND
    ) {
      this.logger.debug(`call findUserByNameHash, return with error: ${response.error.message}`)
    }
    return undefined
  }

  // ---------------- intern helper functions -----------------------------------

  // return result on success or throw error
  protected resolveResponse<T, R>(
    response: JsonRpcEitherResponse<T>,
    onSuccess: (result: T) => R,
  ): R {
    if (response.isSuccess()) {
      return onSuccess(response.result)
    } else if (response.isError()) {
      throw new GradidoNodeRequestError(response.error.message, response)
    }
    throw new GradidoNodeRequestError('no success and no error')
  }

  // template rpcCall, check first if port is open before executing json rpc 2.0 request
  protected async rpcCall<T>(method: string, parameter: any): Promise<JsonRpcEitherResponse<T>> {
    this.logger.debug('call %s with %s', method, parameter)
    await isPortOpenRetry(this.url)
    return this.client.exec<T>(method, parameter)
  }

  // template rpcCall, check first if port is open before executing json rpc 2.0 request,
  // throw error on failure, return result on success
  protected async rpcCallResolved<T>(method: string, parameter: any): Promise<T> {
    const response = await this.rpcCall<WithTimeUsed<T>>(method, parameter)
    return this.resolveResponse(response, (result: WithTimeUsed<T>) => {
      if (result.timeUsed) {
        this.logger.info(`call %s, used ${result.timeUsed}`, method)
      }
      return result as T
    })
  }
}
