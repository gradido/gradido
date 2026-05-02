import { Decay, GradidoUnit } from 'shared'
import { getLastTransaction } from '@/graphql/util/getLastTransaction'

export async function calculateRecipientBalance(
  userId: number,
  amount: GradidoUnit,
  time: Date,
): Promise<{ balance: GradidoUnit; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) {
    return null
  }
  const decay = lastTransaction.balance.calculateDecay(lastTransaction.balanceDate, time)

  const balance = decay.balance.add(amount)

  return { balance, lastTransactionId: lastTransaction.id, decay }
}
