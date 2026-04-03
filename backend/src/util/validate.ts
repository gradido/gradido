import { Decay } from 'shared'
import { TransactionLink as dbTransactionLink, getLastTransaction } from 'database'
import { validate, version } from 'uuid'
import { transactionLinkSummary } from '@/graphql/resolver/util/transactionLinkSummary'
import { GradidoUnit } from 'shared-native'

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
  amount: GradidoUnit,
  time: Date,
  transactionLink?: dbTransactionLink | null,
): Promise<{ decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) {
    return null
  }

  const decay = new Decay(new GradidoUnit(lastTransaction.balance.toString()))
  decay.calculateDecay(lastTransaction.balanceDate, time)

  decay.balance.add(amount)
  const { sumHoldAvailableAmount } = await transactionLinkSummary(userId, time)

  // If we want to redeem a link we need to make sure that the link amount is not considered as blocked
  // else we cannot redeem links which are more or equal to half of what an account actually owns
  const releasedLinkAmount = transactionLink ? new GradidoUnit(transactionLink.holdAvailableAmount.toString()) : new GradidoUnit(0)

  if (sumHoldAvailableAmount.add(releasedLinkAmount).gt(decay.balance)) {
    return null
  }
  return { lastTransactionId: lastTransaction.id, decay }
}

export { calculateBalance, isStringBoolean, isUUID4, isEMail }
