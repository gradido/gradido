/**
 * @DCI-Context
 * Context for process confirmed transactions from node server
 *  - complete transactions in db
 *  - add missing transactions in db
 *  - add missing user in db
 *  - add missing accounts in db
 *  - update account balances
 *  - update transaction balances
 *  - trigger backend for verify
 */

import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { User } from '@entity/User'

import { AccountRepository } from '@/data/Account.repository'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionRepository } from '@/data/Transaction.repository'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'

import { AbstractConfirm } from './AbstractConfirm.role'
import { ConfirmAccountRole } from './ConfirmAccount.role'
import { ConfirmBackendRole } from './ConfirmBackend.role'
import { ConfirmCommunityRole } from './ConfirmCommunity.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ExistingTransactionRole } from './ExistingTransactions.role'
import { UpdateBalanceRole } from './UpdateBalance.role'

export class ConfirmTransactionsContext {
  // confirmed transactions put into map with message id (hex) as key for faster work access
  private transactionsByMessageId: Map<string, ConfirmedTransaction>
  // entities which could be updated for storing as bulk
  private users: User[]
  private accounts: Account[]
  private communities: Community[]

  public constructor(private transactions: ConfirmedTransaction[], private iotaTopic: string) {
    // create map with message ids as key
    this.transactionsByMessageId = transactions.reduce((messageIdMap, transaction) => {
      return messageIdMap.set(Buffer.from(transaction.messageId).toString('hex'), transaction)
    }, new Map<string, ConfirmedTransaction>())
  }

  public async run(): Promise<void> {
    if (!this.transactions.length) {
      return
    }

    // load existing transaction from db
    const { existingTransaction, missingMessageIdsHex } =
      await this.findExistingTransactionsAndMissingMessageIds(
        Array.from(this.transactionsByMessageId.keys()),
      )
    // create non existing transaction from ConfirmedTransaction Protobuf Object
    const newTransactions = await Promise.all(
      missingMessageIdsHex.map(this.createMissingTransaction),
    )
    // remove confirmed existing transactions, upgrade existing Transactions to ConfirmedTransactions, fuse arrays together
    const allTransactionRecipe = newTransactions.concat(
      existingTransaction.filter(this.isNotConfirmed).map(this.updateExistingTransactions),
    )
    // update accounts, user, communities and send backend confirmation requests
    // updateAffectedTablesAndBackend must be called in order, no parallelization here
    allTransactionRecipe.forEach(async (value: ConfirmedTransactionRole, index: number) => {
      logger.debug('foreach transactions index: ', index)
      await this.updateAffectedTablesAndBackend(value)
    })
  }

  public addForSave(entity: User | Account | Community) {
    if (entity instanceof User) {
      this.users.push(entity)
    } else if (entity instanceof Account) {
      this.accounts.push(entity)
    } else if (entity instanceof Community) {
      this.communities.push(entity)
    } else {
      throw new LogError('entity type not implemented yet')
    }
  }

  public getIotaTopic(): string {
    return this.iotaTopic
  }

  /**
   * load already existing transactions from db and filter out message ids from not loaded transactions
   * @param messageIdsHex
   * @returns {existingTransactionRoles: ExistingTransactionRole[], missingMessageIdsHex: string[]}
   */
  private async findExistingTransactionsAndMissingMessageIds(messageIdsHex: string[]): Promise<{
    existingTransaction: ExistingTransactionRole[]
    missingMessageIdsHex: string[]
  }> {
    logger.debug('load transaction recipes for iota message ids:', messageIdsHex)
    const existingTransactions = await TransactionRepository.findExistingTransactions(messageIdsHex)
    const foundMessageIds = existingTransactions
      .map((transaction) => transaction.iotaMessageId?.toString('hex'))
      .filter((messageId) => !!messageId)
    // find message ids for which we don't already have a transaction recipe
    const missingMessageIdsHex = messageIdsHex.filter((id: string) => !foundMessageIds.includes(id))
    return {
      existingTransaction: existingTransactions.map(
        (transaction) => new ExistingTransactionRole(transaction),
      ),
      missingMessageIdsHex,
    }
  }

  private getConfirmedTransaction(messageIdHex: string): ConfirmedTransaction {
    const confirmedTransaction = this.transactionsByMessageId.get(messageIdHex)
    if (!confirmedTransaction) {
      throw new LogError('transaction for message id not longer exist')
    }
    return confirmedTransaction
  }

  /**
   * create transaction complete from ConfirmedTransaction protobuf Object
   * load accounts from db
   * @param messageIdHex
   * @returns ConfirmedTransactionRole
   */
  private async createMissingTransaction(messageIdHex: string): Promise<ConfirmedTransactionRole> {
    logger.info('create transaction from confirmed transaction proto object', {
      iotaMessageId: messageIdHex,
    })
    return await ConfirmedTransactionRole.createFromConfirmedTransaction(
      this.getConfirmedTransaction(messageIdHex),
    )
  }

  private isNotConfirmed(transaction: ExistingTransactionRole): boolean {
    return !transaction.isConfirmed()
  }

  /**
   * upgrade existing transactions to confirmed transactions, fill the missing fields
   * @param existingTransaction
   * @returns ConfirmedTransactionRole
   */
  private updateExistingTransactions(
    existingTransaction: ExistingTransactionRole,
  ): ConfirmedTransactionRole {
    const messageIdHex = existingTransaction.getIotaMessageIdHex()
    logger.debug('update transaction to confirmed transaction', { iotaMessageId: messageIdHex })
    return existingTransaction.setOrCheck(this.getConfirmedTransaction(messageIdHex))
  }

  private async updateAffectedTablesAndBackend(
    confirmedTransactionRole: ConfirmedTransactionRole,
  ): Promise<void> {
    const messageIdHex = confirmedTransactionRole.getIotaMessageIdHex()
    const confirmedTransaction = this.getConfirmedTransaction(messageIdHex)
    const gradidoTransaction = confirmedTransaction.transaction
    const transactionBody = gradidoTransaction.getTransactionBody()
    const transactionType = transactionBody.getTransactionType()
    const account = await AccountRepository.findByPublicKey(transactionBody.getRecipientPublicKey())
    if (!transactionType) {
      throw new LogError('transaction type not set')
    }
    // tell backend that transaction is confirmed
    if (
      [
        TransactionType.GRADIDO_CREATION,
        TransactionType.GRADIDO_TRANSFER,
        TransactionType.GRADIDO_DEFERRED_TRANSFER,
      ].includes(transactionType)
    ) {
      const confirmBackend = new ConfirmBackendRole(confirmedTransactionRole, this)
      await confirmBackend.confirm()
    }
    // confirm other tables, depending on transaction type
    let abstractConfirm: AbstractConfirm | null = null
    switch (transactionType) {
      case TransactionType.GRADIDO_CREATION:
      case TransactionType.GRADIDO_TRANSFER:
        if (!account) {
          throw new LogError('missing recipient account for creation or transfer transaction')
        }
        this.addForSave(account)
        abstractConfirm = new UpdateBalanceRole(confirmedTransactionRole, this, account)
        break
      case TransactionType.COMMUNITY_ROOT:
        abstractConfirm = new ConfirmCommunityRole(confirmedTransactionRole, this)
        break
      case TransactionType.REGISTER_ADDRESS:
        // will also confirm user
        if (!transactionBody.registerAddress) {
          throw new LogError(
            "mal formatted transaction, type registerAddress but don't contain registerAddress Transaction",
          )
        }
        abstractConfirm = new ConfirmAccountRole(
          confirmedTransactionRole,
          this,
          transactionBody.registerAddress,
        )
        break
      default:
        throw new LogError('not implemented yet')
    }
    await abstractConfirm.confirm()
  }
}
