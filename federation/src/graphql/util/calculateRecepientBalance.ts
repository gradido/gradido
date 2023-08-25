import { Decimal } from 'decimal.js-light'

import { getLastTransaction } from './getLastTransaction'
import { calculateDecay } from './decay'
import { Decay } from '../api/1_0/model/Decay'

export async function calculateRecepientBalance(
  userId: number,
  amount: Decimal,
  time: Date,
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) return null

  const decay = calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time)

  const balance = decay.balance.add(amount.toString())

  return { balance, lastTransactionId: lastTransaction.id, decay }
}
