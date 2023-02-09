import { Transaction as DbTransaction } from '@entity/Transaction'

export const getLastTransaction = async (
  userId: number,
  relations?: string[],
): Promise<DbTransaction | undefined> => {
  return DbTransaction.findOne(
    { userId },
    {
      order: { balanceDate: 'DESC', id: 'DESC' },
      relations,
    },
  )
}
