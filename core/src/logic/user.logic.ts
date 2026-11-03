import { dbFindLastTransactionBalance, TransactionLinksSelect } from 'database'
import { Decay, GradidoUnit, InsufficientBalance, Result } from 'shared'
import { transactionLinksDecayed } from './transactionLinksDecayed'

export type UserBalance = {
  balance: GradidoUnit
  decay: Decay
  lastTransactionId: number | null
}

export async function calculateSenderBalance(
  userId: number,
  amount: GradidoUnit,
  time: Date,
  transactionLink?: TransactionLinksSelect,
): Promise<Result<UserBalance, InsufficientBalance>> {
  // let's start this function as early as possible because it is expensive
  const blockedByLinksDecayedPromise = transactionLinksDecayed(userId, time)
  const lastTransaction = await dbFindLastTransactionBalance(userId)
  if (!lastTransaction) {
    return {
      success: false,
      error: new InsufficientBalance(userId, GradidoUnit.fromGradidoCent(0n), amount),
    }
  }
  // TODO: remove after make balance column not null in db
  if (!lastTransaction.balance) {
    throw new Error('Empty balance in transaction')
  }
  const decay = lastTransaction.balance.calculateDecay(lastTransaction.balanceDate, time)

  // If we want to redeem a link we need to make sure that the link amount is not considered as blocked
  const releasedLinkAmount =
    transactionLink && transactionLink.holdAvailableAmount
      ? transactionLink.holdAvailableAmount
      : new GradidoUnit(0n)

  // subtract from sender account
  const balance = decay.balance.subtract(amount)
  const { sumHoldAvailableDecayedAmount } = await blockedByLinksDecayedPromise
  const availableBalanceAfterSend = balance
    .subtract(sumHoldAvailableDecayedAmount)
    .add(releasedLinkAmount)
  if (availableBalanceAfterSend.isNegative()) {
    return {
      success: false,
      error: new InsufficientBalance(userId, availableBalanceAfterSend, amount),
    }
  }
  return { success: true, value: { balance, lastTransactionId: lastTransaction.id, decay } }
}

export async function calculateRecipientBalance(
  userId: number,
  amount: GradidoUnit,
  time: Date,
): Promise<UserBalance> {
  const lastTransaction = await dbFindLastTransactionBalance(userId)
  if (!lastTransaction) {
    return {
      balance: amount,
      lastTransactionId: null,
      decay: {
        balance: amount,
        decay: GradidoUnit.fromGradidoCent(0n),
        start: null,
        end: null,
        duration: null,
      },
    }
  }
  // TODO: remove after make balance column not null in db
  if (!lastTransaction.balance) {
    throw new Error('Empty balance in transaction')
  }
  const decay = lastTransaction.balance.calculateDecay(lastTransaction.balanceDate, time)

  // recipient, add to his account
  const balance = decay.balance.add(amount)
  return { balance, lastTransactionId: lastTransaction.id, decay }
}
