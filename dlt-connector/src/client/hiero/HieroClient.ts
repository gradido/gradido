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

  public async sendMessage(
    topicId: HieroId,
    transaction: GradidoTransaction,
  ): Promise<{ receipt: TransactionReceipt; response: TransactionResponse }> {
    let startTime = new Date()
    this.logger.addContext('topicId', topicId.toString())
    const serializedTransaction = transaction.getSerializedTransaction()
    if (!serializedTransaction) {
      throw new Error('cannot serialize transaction')
    }
    // send one message
    const hieroTransaction = await new TopicMessageSubmitTransaction({
      topicId,
      message: serializedTransaction.data(),
    }).freezeWithSigner(this.wallet)
    let endTime = new Date()
    this.logger.info(`prepare message, until freeze, cost: ${endTime.getTime() - startTime.getTime()}ms`)
    startTime = new Date()
    const signedHieroTransaction = await hieroTransaction.signWithSigner(this.wallet)
    endTime = new Date()
    this.logger.info(`sign message, cost: ${endTime.getTime() - startTime.getTime()}ms`)
    startTime = new Date()
    const sendResponse = await signedHieroTransaction.executeWithSigner(this.wallet)
    endTime = new Date()
    this.logger.info(`send message, cost: ${endTime.getTime() - startTime.getTime()}ms`)
    startTime = new Date()
    const sendReceipt = await sendResponse.getReceiptWithSigner(this.wallet)
    endTime = new Date()
    this.logger.info(`get receipt, cost: ${endTime.getTime() - startTime.getTime()}ms`)
    this.logger.info(
      `message sent to topic ${topicId}, status: ${sendReceipt.status.toString()}, transaction id: ${sendResponse.transactionId.toString()}`,
    )
    startTime = new Date()
    const record = await sendResponse.getRecordWithSigner(this.wallet)
    endTime = new Date()
    this.logger.info(`get record, cost: ${endTime.getTime() - startTime.getTime()}ms`)
    this.logger.info(`message sent, cost: ${record.transactionFee.toString()}`)
    return { receipt: sendReceipt, response: sendResponse }
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
