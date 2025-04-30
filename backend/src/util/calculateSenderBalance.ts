import type { Decimal } from 'decimal.js-light'

import type { Decay } from '@model/Decay'

import { getLastTransaction } from '@/graphql/resolver/util/getLastTransaction'

import { calculateDecay } from './decay'

export async function calculateSenderBalance(
  userId: number,
  amount: Decimal,
  time: Date,
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) {
    return null
  }

  const decay = calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time)

  const balance = decay.balance.add(amount.toString())
  return { balance, lastTransactionId: lastTransaction.id, decay }
}
