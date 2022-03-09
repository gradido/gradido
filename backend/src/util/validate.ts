import { calculateDecay } from './decay'
import Decimal from 'decimal.js-light'
import { Transaction } from '@entity/Transaction'
import { Decay } from '@model/Decay'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { MoreThan } from '@dbTools/typeorm'

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
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await Transaction.findOne({ userId }, { order: { balanceDate: 'DESC' } })
  if (!lastTransaction) return null

  const decay = calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time)

  // TODO why we have to use toString() here?
  const balance = decay.balance.add(amount.toString())
  const toHoldAvailable = await holdAvailable(userId, time)
  if (balance.minus(toHoldAvailable.toString()).lessThan(0)) {
    return null
  }
  return { balance, lastTransactionId: lastTransaction.id, decay }
}

async function holdAvailable(userId: number, date: Date): Promise<Decimal> {
  const openTransactionLinks = await dbTransactionLink.find({
    select: ['holdAvailableAmount'],
    where: { userId, redeemedAt: null, validUntil: MoreThan(date) },
  })

  return openTransactionLinks.reduce(
    (previousValue, currentValue) => previousValue.add(currentValue.holdAvailableAmount.toString()),
    new Decimal(0),
  )
}

export { isHexPublicKey, calculateBalance, isStringBoolean, holdAvailable }
