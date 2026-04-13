import { getLastTransaction } from 'database'
import { Decay, GradidoUnit } from 'shared'

export async function calculateSenderBalance(
  userId: number,
  amount: GradidoUnit,
  time: Date,
): Promise<{ balance: GradidoUnit; decay: Decay; lastTransactionId: number } | null> {
  const lastTransaction = await getLastTransaction(userId)
  if (!lastTransaction) {
    return null
  }
  const lastTransactionBalance = GradidoUnit.fromDecimal(lastTransaction.balance)
  const decay = lastTransactionBalance.calculateDecay(lastTransaction.balanceDate, time)

  const balance = decay.balance.add(amount)
  return { balance, lastTransactionId: lastTransaction.id, decay }
}
