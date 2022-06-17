import { calculateDecay } from './decay'
import Decimal from 'decimal.js-light'
import { Transaction } from '@entity/Transaction'
import { Decay } from '@model/Decay'
import { getCustomRepository } from '@dbTools/typeorm'
import { TransactionLinkRepository } from '@repository/TransactionLink'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'

function isStringBoolean(value: string): boolean {
  const lowerValue = value.toLowerCase()
  if (lowerValue === 'true' || lowerValue === 'false') {
    return true
  }
  return false
}

function isHexPublicKey(publicKey: string): boolean {
  return /^[0-9A-Fa-f]{64}$/i.test(publicKey)
}

async function calculateBalance(
  userId: number,
  amount: Decimal,
  time: Date,
  transactionLink?: dbTransactionLink | null,
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await Transaction.findOne({ userId }, { order: { balanceDate: 'DESC' } })
  if (!lastTransaction) return null

  const decay = calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time)

  // TODO why we have to use toString() here?
  const balance = decay.balance.add(amount.toString())
  const transactionLinkRepository = getCustomRepository(TransactionLinkRepository)
  const { sumHoldAvailableAmount } = await transactionLinkRepository.summary(userId, time)

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

export { isHexPublicKey, calculateBalance, isStringBoolean }
