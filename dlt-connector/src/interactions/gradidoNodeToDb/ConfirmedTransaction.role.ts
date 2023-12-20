import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { AccountLogic } from '@/data/Account.logic'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionBuilder } from '@/data/Transaction.builder'
import { AccountLoggingView } from '@/logging/AccountLogging.view'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRole } from './AbstractTransaction.role'
export class ConfirmedTransactionRole extends AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(transaction: Transaction) {
    super(transaction)
  }

  static async createFromConfirmedTransaction(
    confirmedTransaction: ConfirmedTransaction,
    community: Community,
  ): Promise<ConfirmedTransactionRole> {
    const transactionBuilder = new TransactionBuilder()
    const gradidoTransaction = confirmedTransaction.transaction
    if (gradidoTransaction.parentMessageId && gradidoTransaction.parentMessageId.length === 32) {
      throw new LogError(
        'cross group paring transaction found, please add code for handling it properly!',
      )
    }
    await transactionBuilder.fromGradidoTransactionSearchForAccounts(gradidoTransaction)
    const transaction = transactionBuilder
      .fromConfirmedTransaction(confirmedTransaction)
      .setCommunity(community)
      .build()
    transaction.iotaMessageId = Buffer.from(confirmedTransaction.messageId)
    return new ConfirmedTransactionRole(transaction)
  }

  public calculateCreatedAtBalance(account?: Account): void {
    logger.info('calculateCreatedAtBalance for transaction nr', this.self.nr)
    if (account) {
      logger.debug('calculate account balance for account', new AccountLoggingView(account))
      const accountLogic = new AccountLogic(account)
      this.self.accountBalanceOnCreation = accountLogic.calculateBalanceCreatedAt(
        this.self.createdAt,
        this.self.amount ?? new Decimal(0),
      )
    } else {
      this.self.accountBalanceOnCreation = new Decimal(0)
    }
    if (
      this.self.accountBalanceOnConfirmation
        ?.minus(this.self.accountBalanceOnCreation.toString())
        .abs()
        .greaterThan(1)
    ) {
      throw new LogError('account balances to far apart, is the calculation correct?', {
        calculated: this.self.accountBalanceOnCreation.toString(),
        fromNodeSr: this.self.accountBalanceOnConfirmation.toString(),
        diff: this.self.accountBalanceOnConfirmation
          ?.minus(this.self.accountBalanceOnCreation.toString())
          .toString(),
      })
    }
  }

  // check if it is really a valid confirmed transaction
  public validate(): void {
    super.validate()
    if (!this.self.runningHash || this.self.runningHash.length !== 32) {
      throw new LogError('missing or invalid running hash')
    }
    if (!this.self.accountBalanceOnConfirmation || !this.self.accountBalanceOnCreation) {
      throw new LogError('at least one account balance missing')
    }
    if (!this.self.nr || this.self.nr <= 0) {
      throw new LogError('nr is missing')
    }
    if (!this.self.confirmedAt) {
      throw new LogError('missing confirmed at date')
    }
  }

  public isConfirmed(): boolean {
    return true
  }

  public getConfirmedAt(): Date {
    if (!this.self.confirmedAt) {
      throw new LogError('missing confirmation date')
    }
    return this.self.confirmedAt
  }
}
