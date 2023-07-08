import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { Decimal } from 'decimal.js-light'

import { Decay } from '@model/Decay'

import { getLastTransaction } from '@/graphql/resolver/util/getLastTransaction'
import { transactionLinkSummary } from '@/graphql/resolver/util/transactionLinkSummary'

import { calculateDecay } from './decay'

function isStringBoolean(value: string): boolean {
  const lowerValue = value.toLowerCase()
  if (lowerValue === 'true' || lowerValue === 'false') {
    return true
  }
  return false
}

async function calculateBalance(
  userId: number,
  amount: Decimal,
  time: Date,
  transactionLink?: dbTransactionLink | null,
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) return null

  const decay = calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time)

  const balance = decay.balance.add(amount.toString())
  const { sumHoldAvailableAmount } = await transactionLinkSummary(userId, time)

  // If we want to redeem a link we need to make sure that the link amount is not considered as blocked
  // else we cannot redeem links which are more or equal to half of what an account actually owns
  const releasedLinkAmount = transactionLink ? transactionLink.holdAvailableAmount : new Decimal(0)

  if (
    balance.minus(sumHoldAvailableAmount.toString()).plus(releasedLinkAmount.toString()).lessThan(0)
  ) {
    return null
  }
  return { balance, lastTransactionId: lastTransaction.id, decay }
}

export { calculateBalance, isStringBoolean }
