import { getLastTransaction } from 'database'
import { Decimal } from 'decimal.js-light'
import { calculateDecay } from 'shared'
import { Decay } from '../graphql/model/Decay'

export async function calculateSenderBalance(
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
