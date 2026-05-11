/** Open transaction links from a user, calculate decay to target date and return Link Summary*/

import { AppDatabase, TransactionLink, transactionLinksPendingFromUserOrderByIdASC } from 'database'
import { GradidoUnit } from 'shared'

export interface TransactionLinksDecayedResult {
  sumHoldAvailableDecayedAmount: GradidoUnit
  sumAmount: GradidoUnit
  transactionLinkCount: number
}

export const transactionLinksDecayed = async (
  userId: number,
  date: Date,
): Promise<TransactionLinksDecayedResult> => {
  const summary: TransactionLinksDecayedResult = {
    sumHoldAvailableDecayedAmount: new GradidoUnit(0n),
    sumAmount: new GradidoUnit(0n),
    transactionLinkCount: 0,
  }
  let lastId = 0
  let transactionLinks: TransactionLink[] = []
  const batchSize = AppDatabase.getInstance().getDefaultBatchSize()

  do {
    transactionLinks = await transactionLinksPendingFromUserOrderByIdASC(
      userId,
      batchSize,
      lastId,
      date,
    )
    if (!transactionLinks.length) {
      break
    }
    lastId = transactionLinks[transactionLinks.length - 1].id
    summary.transactionLinkCount += transactionLinks.length
    for (const tx of transactionLinks) {
      summary.sumAmount = summary.sumAmount.add(tx.amount)
      const decayed = tx.holdAvailableAmount.decayed(tx.createdAt, date)
      summary.sumHoldAvailableDecayedAmount = summary.sumHoldAvailableDecayedAmount.add(decayed)
    }
  } while (transactionLinks.length === batchSize)

  return summary
}
