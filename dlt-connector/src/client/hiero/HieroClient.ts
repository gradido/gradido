import {
  AccountBalance,
  AccountBalanceQuery,
  Client,
  LocalProvider,
  PrivateKey,
  Timestamp,
  TopicCreateTransaction,
  TopicId,  
  TopicInfoQuery,
  TopicMessageSubmitTransaction,
  TopicUpdateTransaction,
  TransactionReceipt,
  TransactionResponse,
  Wallet,
} from '@hashgraph/sdk'
import { parse } from 'valibot'
import { GradidoTransaction, HieroTopicId } from 'gradido-blockchain-js'
import { getLogger, Logger } from 'log4js'
import { CONFIG } from '../../config'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { HieroId, hieroIdSchema } from '../../schemas/typeGuard.schema'
import { topicInfoSchema, type TopicInfoOutput } from './output.schema'

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
  }

  public static getInstance(): HieroClient {
    if (!CONFIG.HIERO_ACTIVE) {
      throw new Error('hiero is disabled via config...')
    }
    if (!HieroClient.instance) {
      HieroClient.instance = new HieroClient()
    }

    return HieroClient.instance
  }

  public async sendMessage(
    topicId: HieroId,
    transaction: GradidoTransaction,
  ): Promise<{ receipt: TransactionReceipt; response: TransactionResponse }> {
    const serializedTransaction = transaction.getSerializedTransaction()
    if (!serializedTransaction) {
      throw new Error('cannot serialize transaction')
    }
    // send one message
    const hieroTransaction = await new TopicMessageSubmitTransaction({
      topicId,
      message: serializedTransaction.data(),
    }).freezeWithSigner(this.wallet)
    const signedHieroTransaction = await hieroTransaction.signWithSigner(this.wallet)
    const sendResponse = await signedHieroTransaction.executeWithSigner(this.wallet)
    const sendReceipt = await sendResponse.getReceiptWithSigner(this.wallet)
    this.logger.info(
      `message sent to topic ${topicId}, status: ${sendReceipt.status.toString()}, transaction id: ${sendResponse.transactionId.toString()}`,
    )
    return { receipt: sendReceipt, response: sendResponse }
  }

  public async getBalance(): Promise<AccountBalance> {
    const balance = await new AccountBalanceQuery()
      .setAccountId(this.wallet.getAccountId())
      .executeWithSigner(this.wallet)
    return balance
  }

  public async getTopicInfo(topicId: HieroId): Promise<TopicInfoOutput> {
    const info = await new TopicInfoQuery()
        .setTopicId(TopicId.fromString(topicId))
        .execute(this.client)
    this.logger.debug(JSON.stringify(info, null, 2))
    return parse(topicInfoSchema, {
      topicId: topicId.toString(),
      sequenceNumber: info.sequenceNumber.toNumber(),
      expirationTime: info.expirationTime?.toString(),
      autoRenewPeriod: info.autoRenewPeriod?.seconds,
      autoRenewAccountId: info.autoRenewAccountId?.toString(),
    })
  }

  public async createTopic(): Promise<HieroId> {
    let transaction = await new TopicCreateTransaction().freezeWithSigner(this.wallet)
    transaction = await transaction.signWithSigner(this.wallet)
    const createResponse = await transaction.executeWithSigner(this.wallet)
    const createReceipt = await createResponse.getReceiptWithSigner(this.wallet)
    this.logger.debug(createReceipt.toString())
    return parse(hieroIdSchema, createReceipt.topicId?.toString())
  }

  public async updateTopic(topicId: HieroId): Promise<void> {
    let transaction = new TopicUpdateTransaction()
    transaction.setExpirationTime(new Date(new Date().getTime() + MIN_AUTORENEW_PERIOD * 1000))
    transaction.setTopicId(TopicId.fromString(topicId))
    transaction = await transaction.freezeWithSigner(this.wallet)
    transaction = await transaction.signWithSigner(this.wallet)
    const updateResponse = await transaction.executeWithSigner(this.wallet)
    const updateReceipt = await updateResponse.getReceiptWithSigner(this.wallet)
    this.logger.debug(updateReceipt.toString())
  }
}
