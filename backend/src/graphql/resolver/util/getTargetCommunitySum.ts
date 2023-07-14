import { LessThan } from '@dbTools/typeorm'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { calculateDecay } from '@/util/decay'

export const getTargetCommunitySum = async (targetDate: Date): Promise<Decimal> => {
  const latestTransaction = await DbTransaction.findOne({
    where: {
      balanceDate: LessThan(targetDate),
    },
    order: { balanceDate: 'DESC', id: 'DESC' },
  })
  if (!latestTransaction) return new Decimal('0')
  return calculateDecay(latestTransaction.communitySum, latestTransaction.balanceDate, targetDate)
    .balance
}
