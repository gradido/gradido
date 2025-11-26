import { Decimal } from 'decimal.js-light'
import { calculateDecay } from 'shared'
import { getLastTransaction } from '@/graphql/util/getLastTransaction'
import { Decay } from '../model/Decay'

export async function calculateRecipientBalance(
  userId: number,
  amount: Decimal,
  time: Date,
): Promise<{ balance: Decimal; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) {
    return null
  }

  const decay = new Decay(
    calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, time),
  )

  const balance = decay.balance.add(amount.toString())

  return { balance, lastTransactionId: lastTransaction.id, decay }
}
