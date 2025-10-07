import { Decimal } from 'decimal.js-light'

import { Decay } from '../graphql/model/Decay'

import { getLastTransaction } from 'database'

import { calculateDecay } from 'shared'

export async function calculateSenderBalance(
  userId: number,
  amount: Decimal,
  time: Date,
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) {
    return null
  }

  const decay = new Decay(calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time))

  const balance = decay.balance.add(amount.toString())
  return { balance, lastTransactionId: lastTransaction.id, decay }
}
