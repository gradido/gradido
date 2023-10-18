import { Decimal } from 'decimal.js-light'

import { calculateDecay } from '@/federation/server/util/decay'
import { getLastTransaction } from '@/federation/server/util/getLastTransaction'

// eslint-disable-next-line import/no-relative-parent-imports
import { Decay } from '../model/Decay'

export async function calculateRecipientBalance(
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
