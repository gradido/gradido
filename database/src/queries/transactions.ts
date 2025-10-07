import { Transaction as DbTransaction } from '../entity'

export const getLastTransaction = async (
  userId: number,
  relations?: string[],
): Promise<DbTransaction | null> => {
  return DbTransaction.findOne({
    where: { userId },
    order: { balanceDate: 'DESC', id: 'DESC' },
    relations,
  })
}
