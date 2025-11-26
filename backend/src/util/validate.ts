import { Decay } from 'core'
import { TransactionLink as dbTransactionLink, getLastTransaction } from 'database'
import { Decimal } from 'decimal.js-light'
import { calculateDecay } from 'shared'
import { validate, version } from 'uuid'
import { transactionLinkSummary } from '@/graphql/resolver/util/transactionLinkSummary'

function isStringBoolean(value: string): boolean {
  const lowerValue = value.toLowerCase()
  if (lowerValue === 'true' || lowerValue === 'false') {
    return true
  }
  return false
}

function isUUID4(value: string): boolean {
  return validate(value) && version(value) === 4
}

function isEMail(value: string): boolean {
  return /^.{2,}@.{2,}\..{2,}$/.exec(value) !== null
}

async function calculateBalance(
  userId: number,
  amount: Decimal,
  time: Date,
  transactionLink?: dbTransactionLink | null,
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) {
    return null
  }

  const decay = new Decay(
    calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time),
  )

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

export { calculateBalance, isStringBoolean, isUUID4, isEMail }
