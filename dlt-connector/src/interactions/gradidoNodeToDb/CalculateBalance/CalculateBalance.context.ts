import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { TransactionType } from '@/data/proto/3_3/enum/TransactionType'
import { LogError } from '@/server/LogError'

import { CalculateBalanceCreationRole } from './CalculateBalanceCreation.role'
import { CalculateBalanceRecipientRole } from './CalculateBalanceRecipient.role'
import { CalculateBalanceSenderRole } from './CalculateBalanceSender.role'
import { CalculateBalanceTransferRecipientRole } from './CalculateBalanceTransferRecipient.role'
import { CalculateBalanceTransferSenderRole } from './CalculateBalanceTransferSender.role'

export enum BalanceType {
  ON_CREATION,
  ON_CONFIRMATION,
}

/**
 * calculate balance for current transaction
 * assume that needed accounts on transaction available and contain balances updated on last affecting transaction
 * calculate only decayed balance for transaction which don't affect the balance
 */
export class CalculateBalanceContext {
  // eslint-disable-next-line no-useless-constructor
  public constructor(private transaction: Transaction) {}

  public run(type: BalanceType): { senderBalance?: Decimal; recipientBalance?: Decimal } {
    switch (this.transaction.type as TransactionType) {
      case TransactionType.GRADIDO_CREATION:
        return {
          recipientBalance: new CalculateBalanceCreationRole(this.transaction, type).calculate(),
        }
      case TransactionType.GRADIDO_TRANSFER:
        return {
          senderBalance: new CalculateBalanceTransferSenderRole(this.transaction, type).calculate(),
          recipientBalance: new CalculateBalanceTransferRecipientRole(
            this.transaction,
            type,
          ).calculate(),
        }
      case TransactionType.GRADIDO_DEFERRED_TRANSFER:
        throw new LogError('GRADIDO_DEFERRED_TRANSFER not implemented yet')
    }
    return {
      senderBalance: this.transaction.signingAccount
        ? new CalculateBalanceSenderRole(this.transaction, type).calculate()
        : undefined,
      recipientBalance: this.transaction.recipientAccount
        ? new CalculateBalanceRecipientRole(this.transaction, type).calculate()
        : undefined,
    }
  }
}
