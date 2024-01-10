import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionType } from '@/data/proto/3_3/enum/TransactionType'
import { TransactionBuilder } from '@/data/Transaction.builder'
import { logger } from '@/logging/logger'
import { LogError } from '@/server/LogError'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { BalanceType, CalculateBalanceContext } from './CalculateBalance/CalculateBalance.context'

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

  public calculateCreatedAtBalance(): void {
    logger.info('calculateCreatedAtBalance for transaction nr', this.self.nr)
    const { senderBalance, recipientBalance } = new CalculateBalanceContext(this.self).run(
      BalanceType.ON_CREATION,
    )
    if (this.self.type === TransactionType.GRADIDO_CREATION && recipientBalance) {
      this.self.accountBalanceOnCreation = recipientBalance
    } else if (senderBalance) {
      this.self.accountBalanceOnCreation = senderBalance
    } else {
      this.self.accountBalanceOnCreation = new Decimal(0)
    }
    if (
      this.self.accountBalanceOnConfirmation
        ?.minus(this.self.accountBalanceOnCreation.toString())
        .abs()
        .greaterThan(2)
    ) {
      if (!this.self.confirmedAt) {
        throw new LogError('missing confirmedAt')
      }
      throw new LogError('account balances to far apart, is the calculation correct?', {
        calculated: this.self.accountBalanceOnCreation.toString(),
        fromNodeSr: this.self.accountBalanceOnConfirmation.toString(),
        diff: this.self.accountBalanceOnConfirmation
          ?.minus(this.self.accountBalanceOnConfirmation.toString())
          .toString(),
        timeDiff: (this.self.confirmedAt.getTime() - this.self.createdAt.getTime()) / 1000,
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
