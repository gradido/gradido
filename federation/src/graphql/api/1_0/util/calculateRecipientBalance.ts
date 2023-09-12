import { calculateDecay } from '@/graphql/util/decay'
import { getLastTransaction } from '@/graphql/util/getLastTransaction'
import { Decimal } from 'decimal.js-light'
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
