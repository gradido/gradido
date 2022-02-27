import { calculateDecay } from './decay'
import Decimal from './decimal'
import { Transaction } from '@entity/Transaction'

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
): Promise<Decimal | null> {
  if (amount.lessThan(0)) return null

  const lastTransaction = await Transaction.findOne({ userId }, { order: { balanceDate: 'DESC' } })
  if (!lastTransaction) return null

  const accountBalance = calculateDecay(
    lastTransaction.balance,
    lastTransaction.balanceDate,
    time,
  ).balance.add(amount)
  return accountBalance.greaterThan(0) ? accountBalance : null
}

export { isHexPublicKey, calculateBalance, isStringBoolean }
