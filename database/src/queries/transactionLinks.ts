import { TransactionLink as DbTransactionLink } from "../entity/TransactionLink"

export async function findTransactionLinkByCode(code: string): Promise<DbTransactionLink> {
  return await DbTransactionLink.findOneOrFail({
    where: { code },
    withDeleted: true,
  })
}
