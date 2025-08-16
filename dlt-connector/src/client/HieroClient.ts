import {
  AccountBalance,
  AccountBalanceQuery,
  Client,
  LocalProvider,
  PrivateKey,
  TopicMessageSubmitTransaction,
  TransactionReceipt,
  TransactionResponse,
  Wallet,
} from '@hashgraph/sdk'
import { GradidoTransaction } from 'gradido-blockchain-js'
import { getLogger, Logger } from 'log4js'
import { CONFIG } from '../config'
import { LOG4JS_BASE_CATEGORY } from '../config/const'
import { HieroId } from '../schemas/typeGuard.schema'

export class HieroClient {
  private static instance: HieroClient
  wallet: Wallet
  logger: Logger

  private constructor() {
    this.logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.HieroClient`)
    const provider = LocalProvider.fromClient(Client.forName(CONFIG.HIERO_HEDERA_NETWORK))
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
}
