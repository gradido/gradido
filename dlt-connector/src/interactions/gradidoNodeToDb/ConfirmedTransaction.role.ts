import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { AccountLogic } from '@/data/Account.logic'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionBuilder } from '@/data/Transaction.builder'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class ConfirmedTransactionRole extends AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(transaction: Transaction) {
    super(transaction)
    this.validate()
  }

  static async createFromConfirmedTransaction(
    confirmedTransaction: ConfirmedTransaction,
  ): Promise<ConfirmedTransactionRole> {
    const transactionBuilder = new TransactionBuilder()
    const gradidoTransaction = confirmedTransaction.transaction
    if (gradidoTransaction.parentMessageId && gradidoTransaction.parentMessageId.length === 32) {
      throw new LogError(
        'cross group paring transaction found, please add code for handling it properly!',
      )
    }
    await transactionBuilder.fromGradidoTransactionSearchForAccounts(gradidoTransaction)
    const transaction = transactionBuilder.build()
    transaction.iotaMessageId = confirmedTransaction.messageId
    return new ConfirmedTransactionRole(transaction)
  }

  public async calculateCreatedAtBalance(account: Account): Promise<void> {
    const accountLogic = new AccountLogic(account)
    this.self.accountBalanceCreatedAt = accountLogic.calculateBalanceCreatedAt(
      this.self.createdAt,
      this.self.amount ?? new Decimal(0),
    )
  }

  // check if it is really a valid confirmed transaction
  public validate(): void {
    super.validate()
    if (!this.self.runningHash || this.self.runningHash.length !== 32) {
      throw new LogError('missing or invalid running hash')
    }
    if (!this.self.accountBalanceConfirmedAt || !this.self.accountBalanceCreatedAt) {
      throw new LogError('at least one account balance missing')
    }
    if (!this.self.nr || this.self.nr <= 0) {
      throw new LogError('nr is missing')
    }
    if (!this.self.iotaMilestone || this.self.iotaMilestone === 0) {
      throw new LogError('missing iota milestone')
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
