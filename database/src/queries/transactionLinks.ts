import { TransactionLink as DbTransactionLink } from '../entity'

export async function findTransactionLinkByCode(code: string): Promise<DbTransactionLink> {
  return await DbTransactionLink.findOneOrFail({
    where: { code },
    withDeleted: true,
  })
}
