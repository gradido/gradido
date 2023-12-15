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
import { Transaction } from '@entity/Transaction'

import { CommunityRepository } from '@/data/Community.repository'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionRepository } from '@/data/Transaction.repository'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { AccountLoggingView } from '@/logging/AccountLogging.view'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'

import { AbstractConfirm } from './AbstractConfirm.role'
import { ConfirmAccountRole } from './ConfirmAccount.role'
import { ConfirmBackendRole } from './ConfirmBackend.role'
import { ConfirmCommunityRole } from './ConfirmCommunity.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'
import { ExistingTransactionRole } from './ExistingTransactions.role'
import { LoadOrCreateAccountsForTransactionContext } from './LoadOrCreateAccountsForTransaction/LoadOrCreateAccountsForTransaction.context'
import { UpdateBalanceRole } from './UpdateBalance.role'

export interface TransactionSet {
  protoConfirmedTransaction: ConfirmedTransaction
  confirmedTransactionRole: ConfirmedTransactionRole
}

export class ConfirmTransactionsContext {
  // confirmed transactions put into map with message id (hex) as key for faster work access
  private transactionsByMessageId: Map<string, ConfirmedTransaction>

  private transactionSets: TransactionSet[] = []
  // entities which could be updated for storing as bulk
  // use map to make sure accounts are unique, no need to store accounts more than one time
  // don't use set because I don't know if ordering is working with higher order objects without operator overloading like in C++
  // use account public key hex as key
  private accounts: Map<string, Account> = new Map()

  private community: Community

  public constructor(private transactions: ConfirmedTransaction[], private iotaTopic: string) {
    // create map with message ids as key
    this.transactionsByMessageId = transactions.reduce((messageIdMap, transaction) => {
      return messageIdMap.set(Buffer.from(transaction.messageId).toString('hex'), transaction)
    }, new Map<string, ConfirmedTransaction>())
  }

  /**
   *
   * @returns last stored transaction nr
   */
  public async run(): Promise<number> {
    if (!this.transactions.length) {
      return -1
    }
    const community = await CommunityRepository.findByIotaTopic(this.iotaTopic)
    if (community) {
      this.community = community
    } else {
      throw new LogError('cannot find community for iota topic ', this.iotaTopic)
    }
    // load existing transaction from db
    const { existingTransaction, missingMessageIdsHex } =
      await this.findExistingTransactionsAndMissingMessageIds(
        Array.from(this.transactionsByMessageId.keys()),
      )
    // create non existing transaction from ConfirmedTransaction Protobuf Object
    const newTransactions = await Promise.all(
      missingMessageIdsHex.map(this.createMissingTransaction.bind(this)),
    )
    // remove confirmed existing transactions, upgrade existing Transactions to ConfirmedTransactions, fuse arrays together
    const allTransactions = newTransactions.concat(
      existingTransaction.filter(this.isNotConfirmed).map(this.updateExistingTransactions),
    )
    // make sure, order is correct, transactions must be proceed in sequence
    allTransactions.sort((a, b) => a.sortByNr(b))
    this.transactionSets = allTransactions.map((value) => {
      return {
        protoConfirmedTransaction: this.getConfirmedTransaction(value.getIotaMessageIdHex()),
        confirmedTransactionRole: value,
      }
    })

    // load all accounts and create missing
    const loadOrCreateAccounts = new LoadOrCreateAccountsForTransactionContext(this.transactionSets)
    const createdAccounts = await loadOrCreateAccounts.run()
    // put accounts into storing array
    createdAccounts.forEach(this.addForSave.bind(this))

    // update accounts, user, communities and send backend confirmation requests
    // updateAffectedTablesAndBackend must be called in order, no parallelization here
    // use for loop because needs to run in sequence
    let index = 0
    for await (const value of this.transactionSets) {
      logger.debug('foreach transactions ', {
        index,
        nr: value.confirmedTransactionRole.getTransaction().nr,
      })
      await this.updateAffectedTablesAndBackend(value)
      index++
    }

    // save changed accounts and users (via cascading) with one db query
    if (this.accounts.size) {
      await Account.save(Array.from(this.accounts.values()))
    }

    // check if we have skip a transaction
    // return last transaction nr
    const lastTransactionNr = await this.checkTransactionNrsReturnLast(allTransactions)
    // finally save changed and new transactions
    await Transaction.save(allTransactions.map((value) => value.getTransaction()))
    return lastTransactionNr
  }

  public addForSave(entity: Account) {
    const publicKey = entity.derive2Pubkey.toString('hex')
    if (!this.accounts.has(publicKey)) {
      logger.debug('add new or changed account for saving', new AccountLoggingView(entity))
      this.accounts.set(entity.derive2Pubkey.toString('hex'), entity)
    } else {
      logger.debug('skip already existing account', { publicKey })
    }
  }

  public getIotaTopic(): string {
    return this.iotaTopic
  }

  private async checkTransactionNrsReturnLast(
    confirmedTransactionRoles: ConfirmedTransactionRole[],
  ): Promise<number> {
    const allTransactionEntities = confirmedTransactionRoles.map(
      (value: ConfirmedTransactionRole) => value.getTransaction(),
    )
    // check if we don't miss a transaction in between
    let lastTransactionNr = 0
    const lastTransaction = await TransactionRepository.getLastConfirmedTransactionForCommunity(
      this.community.id,
    )
    if (lastTransaction) {
      if (!lastTransaction.nr) {
        throw new LogError('missing transaction nr')
      }
      lastTransactionNr = lastTransaction.nr
    }
    return allTransactionEntities.reduce<number>(
      (lastTransactionNr: number, currentTransaction: Transaction): number => {
        if (!currentTransaction.nr || lastTransactionNr + 1 !== currentTransaction.nr) {
          throw new LogError('error, missing transaction nr', {
            lastKnown: lastTransactionNr,
            new: currentTransaction.nr,
          })
        }
        return currentTransaction.nr
      },
      lastTransactionNr,
    )
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
      throw new LogError('transaction for message id not longer exist', {
        key: messageIdHex,
        keys: this.transactionsByMessageId.keys(),
      })
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
    const confirmedTransaction = this.getConfirmedTransaction(messageIdHex)
    return await ConfirmedTransactionRole.createFromConfirmedTransaction(
      confirmedTransaction,
      this.community,
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

  private async updateAffectedTablesAndBackend(transactionSet: TransactionSet): Promise<void> {
    const confirmedTransaction = transactionSet.protoConfirmedTransaction
    const confirmedTransactionRole = transactionSet.confirmedTransactionRole
    const gradidoTransaction = confirmedTransaction.transaction
    const transactionBody = gradidoTransaction.getTransactionBody()
    const transactionType = transactionBody.getTransactionType()

    if (!transactionType) {
      throw new LogError('transaction type not set')
    }
    // community root transaction is a bit special because it didn't has an account for singing because the community is the signing account
    if (transactionType === TransactionType.COMMUNITY_ROOT) {
      // update confirmation date of Community, AUF Account and GMW Account
      await new ConfirmCommunityRole(confirmedTransactionRole, this).confirm()
      confirmedTransactionRole.calculateCreatedAtBalance()
      confirmedTransactionRole.validate()
      return
    }
    let account = confirmedTransactionRole.getTransaction().signingAccount
    if (!account) {
      throw new LogError('missing singing account')
    }

    // calculate balance based on creation date
    // balance based on confirmation date already calculated on GradidoNode
    // update always if account exist, even for transaction which don't move gradidos around
    confirmedTransactionRole.calculateCreatedAtBalance(account)
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
        // use recipient account for creation
        account = confirmedTransactionRole.getTransaction().recipientAccount
      // eslint-disable-next-line no-fallthrough
      case TransactionType.GRADIDO_TRANSFER:
        // use signer/sender account for transfer transaction, balance in confirmedTransaction is only for sender
        if (!account) {
          throw new LogError('missing account for creation or transfer transaction')
        }
        // update balance fields in account entity
        abstractConfirm = new UpdateBalanceRole(confirmedTransactionRole, this, account)
        break
      case TransactionType.REGISTER_ADDRESS:
        // will also confirm user
        if (!transactionBody.registerAddress) {
          throw new LogError(
            "mal formatted transaction, type registerAddress but don't contain registerAddress Transaction",
          )
        }
        // update confirmation date of account and user,
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
    confirmedTransactionRole.validate()
  }
}
