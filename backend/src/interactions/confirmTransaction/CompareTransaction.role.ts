import { Transaction } from '@entity/Transaction'

import { ConfirmedTransactionInput } from '@/graphql/arg/ConfirmTransactionInput'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { calculateDecay } from '@/util/decay'

/**
 * load transaction by id or iota message id and
 * check if confirm transaction call contain the same data stored in db
 */
export class CompareTransactionRole {
  public constructor(private confirmedTransactionInput: ConfirmedTransactionInput) {}

  /**
   * check if confirmed transaction is really our transaction
   */
  public verify(transaction: Transaction): void {
    if (
      this.confirmedTransactionInput.gradidoId &&
      this.confirmedTransactionInput.gradidoId !== transaction.userGradidoID
    ) {
      throw new LogError('user gradido id differ')
    }
    const confirmedBalanceDate = new Date(this.confirmedTransactionInput.balanceDate)
    if (transaction.balanceDate > confirmedBalanceDate) {
      throw new LogError('backend balanceDate is newer as dlt connector confirmed balance date')
    }
    // convert to string because as Decimal subtraction didn't work
    const balance = this.confirmedTransactionInput.balance.toString()
    const decay = calculateDecay(transaction.balance, transaction.balanceDate, confirmedBalanceDate)
    if (decay.balance.sub(balance).abs().greaterThan('0.0000001')) {
      logger.error(
        'time diff: %d ms',
        transaction.balanceDate.getTime() - confirmedBalanceDate.getTime(),
      )
      logger.error('diff: %s', decay.balance.sub(balance).toString())
      throw new LogError(
        'balances differ to much',
        decay.balance,
        balance,
        decay.balance.sub(balance).abs(),
      )
    } else {
      logger.info(
        'input balance: %s, calculated balance: %s',
        this.confirmedTransactionInput.balance.toString(),
        decay.balance.toString(),
      )
    }
  }
}
