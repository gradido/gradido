import { MoreThan } from '@dbTools/typeorm'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { User as DbUser } from '@entity/User'
import { Order } from '@enum/Order'
import Paginated from '@arg/Paginated'
import TransactionLinkFilters from '@arg/TransactionLinkFilters'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'

export default async function transactionLinkList(
  { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  filters: TransactionLinkFilters | null,
  user: DbUser,
): Promise<TransactionLinkResult> {
  const { withDeleted, withExpired, withRedeemed } = filters || {
    withDeleted: false,
    withExpired: false,
    withRedeemed: false,
  }
  const [transactionLinks, count] = await DbTransactionLink.findAndCount({
    where: {
      user: user.id,
      ...(!withRedeemed && { redeemedBy: null }),
      ...(!withExpired && { validUntil: MoreThan(new Date()) }),
    },
    withDeleted,
    order: {
      createdAt: order,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  return {
    count,
    links: transactionLinks.map((tl) => new TransactionLink(tl, user)),
  }
}
