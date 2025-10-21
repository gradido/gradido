import {
  AccountBalance,
  AccountBalanceQuery,
  Client,
  LocalProvider,
  PrivateKey,
  TopicCreateTransaction,
  TopicId,
  TopicInfoQuery,
  TopicMessageSubmitTransaction,
  TopicUpdateTransaction,
  TransactionId,
  TransactionReceipt,
  TransactionResponse,
  Wallet,
} from '@hashgraph/sdk'
import { GradidoTransaction, HieroTopicId } from 'gradido-blockchain-js'
import { getLogger, Logger } from 'log4js'
import { parse } from 'valibot'
import { CONFIG } from '../../config'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { HieroId, hieroIdSchema } from '../../schemas/typeGuard.schema'
import { type TopicInfoOutput, topicInfoSchema } from './output.schema'

// https://docs.hedera.com/hedera/sdks-and-apis/hedera-api/consensus/consensusupdatetopic
export const MIN_AUTORENEW_PERIOD = 6999999 //seconds
export const MAX_AUTORENEW_PERIOD = 8000001 // seconds

export class HieroClient {
  private static instance: HieroClient
  wallet: Wallet
  client: Client
  logger: Logger
  // transaction counter for logging
  transactionInternNr: number = 0
  pendingPromises: Promise<void>[] = []

  private constructor() {
    this.logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.HieroClient`)
    this.client = Client.forName(CONFIG.HIERO_HEDERA_NETWORK)
    const provider = LocalProvider.fromClient(this.client)
    let operatorKey: PrivateKey
    if (CONFIG.HIERO_OPERATOR_KEY.length === 64) {
      operatorKey = PrivateKey.fromStringED25519(CONFIG.HIERO_OPERATOR_KEY)
    } else {
      operatorKey = PrivateKey.fromStringECDSA(CONFIG.HIERO_OPERATOR_KEY)
    }
    this.wallet = new Wallet(CONFIG.HIERO_OPERATOR_ID, operatorKey, provider)
    this.client.setOperator(CONFIG.HIERO_OPERATOR_ID, operatorKey)
  }

  public static getInstance(): HieroClient {
    if (!HieroClient.instance) {
      HieroClient.instance = new HieroClient()
    }

    return HieroClient.instance
  }

  public async waitForPendingPromises() {
    const startTime = new Date()
    this.logger.info(`waiting for ${this.pendingPromises.length} pending promises`)
    await Promise.all(this.pendingPromises)
    const endTime = new Date()
    this.logger.info(
      `all pending promises resolved, used time: ${endTime.getTime() - startTime.getTime()}ms`,
    )
  }

  public async sendMessage(
    topicId: HieroId,
    transaction: GradidoTransaction,
  ): Promise<TransactionId | null> {
    const startTime = new Date()
    this.transactionInternNr++
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.HieroClient`)
    logger.addContext('trNr', this.transactionInternNr)
    logger.addContext('topicId', topicId.toString())
    const serializedTransaction = transaction.getSerializedTransaction()
    if (!serializedTransaction) {
      throw new Error('cannot serialize transaction')
    }
    // send one message
    const hieroTransaction = await new TopicMessageSubmitTransaction({
      topicId,
      message: serializedTransaction.data(),
    }).freezeWithSigner(this.wallet)
    // sign and execute transaction needs some time, so let it run in background
    const pendingPromiseIndex = this.pendingPromises.push(
      hieroTransaction
        .signWithSigner(this.wallet)
        .then(async (signedHieroTransaction) => {
          const sendResponse = await signedHieroTransaction.executeWithSigner(this.wallet)
          logger.info(
            `message sent to topic ${topicId}, transaction id: ${sendResponse.transactionId.toString()}`,
          )
          if (logger.isInfoEnabled()) {
            // only for logging
            sendResponse.getReceiptWithSigner(this.wallet).then((receipt) => {
              logger.info(`message send status: ${receipt.status.toString()}`)
            })
            // only for logging
            sendResponse.getRecordWithSigner(this.wallet).then((record) => {
              logger.info(`message sent, cost: ${record.transactionFee.toString()}`)
              const localEndTime = new Date()
              logger.info(
                `HieroClient.sendMessage used time (full process): ${localEndTime.getTime() - startTime.getTime()}ms`,
              )
            })
          }
        })
        .catch((e) => {
          logger.error(e)
        })
        .finally(() => {
          this.pendingPromises.splice(pendingPromiseIndex, 1)
        }),
    )
    const endTime = new Date()
    logger.info(`HieroClient.sendMessage used time: ${endTime.getTime() - startTime.getTime()}ms`)
    return hieroTransaction.transactionId
  }

  public async getBalance(): Promise<AccountBalance> {
    const balance = await new AccountBalanceQuery()
      .setAccountId(this.wallet.getAccountId())
      .executeWithSigner(this.wallet)
    return balance
  }

  public async getTopicInfo(topicId: HieroId): Promise<TopicInfoOutput> {
    this.logger.addContext('topicId', topicId.toString())
    const info = await new TopicInfoQuery()
      .setTopicId(TopicId.fromString(topicId))
      .execute(this.client)
    this.logger.info(`topic is valid until ${info.expirationTime?.toDate()?.toLocaleString()}`)
    if (info.topicMemo) {
      this.logger.info(`topic memo: ${info.topicMemo}`)
    }
    this.logger.debug(`topic sequence number: ${info.sequenceNumber.toNumber()}`)
    // this.logger.debug(JSON.stringify(info, null, 2))
    return parse(topicInfoSchema, {
      topicId: topicId.toString(),
      sequenceNumber: info.sequenceNumber.toNumber(),
      expirationTime: info.expirationTime?.toDate(),
      autoRenewPeriod: info.autoRenewPeriod?.seconds.toNumber(),
      autoRenewAccountId: info.autoRenewAccountId?.toString(),
    })
  }

  public async createTopic(topicMemo?: string): Promise<HieroId> {
    let transaction = new TopicCreateTransaction({
      topicMemo,
      adminKey: undefined,
      submitKey: undefined,
      autoRenewPeriod: undefined,
      autoRenewAccountId: undefined,
    })

    transaction = await transaction.freezeWithSigner(this.wallet)
    transaction = await transaction.signWithSigner(this.wallet)
    const createResponse = await transaction.executeWithSigner(this.wallet)
    const createReceipt = await createResponse.getReceiptWithSigner(this.wallet)
    this.logger.debug(createReceipt.toString())
    this.logger.addContext('topicId', createReceipt.topicId?.toString())
    const record = await createResponse.getRecordWithSigner(this.wallet)
    this.logger.info(`topic created, cost: ${record.transactionFee.toString()}`)
    return parse(hieroIdSchema, createReceipt.topicId?.toString())
  }

  public async updateTopic(topicId: HieroId): Promise<void> {
    this.logger.addContext('topicId', topicId.toString())
    let transaction = new TopicUpdateTransaction()
    transaction.setExpirationTime(new Date(new Date().getTime() + MIN_AUTORENEW_PERIOD * 1000))
    transaction.setTopicId(TopicId.fromString(topicId))
    transaction = await transaction.freezeWithSigner(this.wallet)
    transaction = await transaction.signWithSigner(this.wallet)
    const updateResponse = await transaction.executeWithSigner(this.wallet)
    const updateReceipt = await updateResponse.getReceiptWithSigner(this.wallet)
    this.logger.debug(updateReceipt.toString())
    const record = await updateResponse.getRecordWithSigner(this.wallet)
    this.logger.info(`topic updated, cost: ${record.transactionFee.toString()}`)
  }
}
