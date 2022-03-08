import { calculateDecay } from './decay'
import Decimal from 'decimal.js-light'
import { Transaction } from '@entity/Transaction'
import { Decay } from '@model/Decay'

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
  if (balance.lessThan(0)) {
    return null
  }
  return { balance, lastTransactionId: lastTransaction.id, decay }
}

export { isHexPublicKey, calculateBalance, isStringBoolean }
