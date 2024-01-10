import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionLogic } from '@/data/Transaction.logic'
import { LogError } from '@/server/LogError'
import { longToNumber, timestampSecondsToDate } from '@/utils/typeConverter'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { ConfirmedTransactionRole } from './ConfirmedTransaction.role'

export class ExistingTransactionRole extends AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  constructor(transaction: Transaction) {
    super(transaction)
  }

  public isConfirmed(): boolean {
    return new TransactionLogic(this.self).isConfirmed()
  }

  /**
   * set missing parameter which only exist on confirmed transactions
   * if already set, compare and throw if there aren't identical
   * after that it is essentially a confirmed transaction so let us return this new role
   * @param confirmedTransactionProto
   * @returns ConfirmedTransactionRole
   */
  public setOrCheck(confirmedTransactionProto: ConfirmedTransaction): ConfirmedTransactionRole {
    // set or check nr
    if (!this.self.nr) {
      this.self.nr = longToNumber(confirmedTransactionProto.id)
    } else {
      if (this.self.nr.toString() !== confirmedTransactionProto.id.toString()) {
        throw new LogError('existing transaction has deviating nr', {
          existing: this.self.nr,
          incoming: confirmedTransactionProto.id,
        })
      }
    }

    // set or check running hash
    if (!this.self.runningHash) {
      this.self.runningHash = Buffer.from(confirmedTransactionProto.runningHash)
    } else {
      if (this.self.runningHash.compare(confirmedTransactionProto.runningHash) !== 0) {
        throw new LogError('existing transaction has deviating runningHash', {
          existing: this.self.runningHash.toString('hex'),
          incoming: confirmedTransactionProto.runningHash.toString('hex'),
        })
      }
    }

    // set or check account balance based on confirmation date
    if (!this.self.accountBalanceOnConfirmation) {
      this.self.accountBalanceOnConfirmation = new Decimal(confirmedTransactionProto.accountBalance)
    } else {
      if (
        this.self.accountBalanceOnConfirmation.toString() !==
        confirmedTransactionProto.accountBalance
      ) {
        throw new LogError(
          'existing transaction has deviating account balance based on confirmation date',
          {
            existing: this.self.accountBalanceOnConfirmation.toString(),
            incoming: confirmedTransactionProto.accountBalance,
          },
        )
      }
    }

    // set or check confirmation date
    const incomingConfirmationDate = timestampSecondsToDate(confirmedTransactionProto.confirmedAt)
    if (!this.self.confirmedAt) {
      this.self.confirmedAt = incomingConfirmationDate
    } else {
      if (this.self.confirmedAt.getTime() !== incomingConfirmationDate.getTime()) {
        throw new LogError('existing transaction has deviation confirmation date', {
          existing: this.self.confirmedAt.toString(),
          incoming: incomingConfirmationDate.toString(),
        })
      }
    }
    return new ConfirmedTransactionRole(this.self)
  }
}
