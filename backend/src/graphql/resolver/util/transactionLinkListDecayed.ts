import { Paginated } from '@arg/Paginated'
import { TransactionLinkFilters } from '@arg/TransactionLinkFilters'
import { Order } from '@enum/Order'
import { ThankYouGreeting } from '@model/ThankYouGreeting'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'
import {
  TransactionLink as DbTransactionLink,
  User as DbUser,
  dbSelectThankYouGreetingsByLinkCodes,
} from 'database'
import { IsNull, MoreThan } from 'typeorm'

import { User } from '@/graphql/model/User'

export async function transactionLinkListDecayed(
  { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  filters: TransactionLinkFilters | null,
  user: DbUser,
): Promise<TransactionLinkResult> {
  const { withDeleted, withExpired, withRedeemed } = filters ?? {
    withDeleted: false,
    withExpired: false,
    withRedeemed: false,
  }
  const [transactionLinks, count] = await DbTransactionLink.findAndCount({
    where: {
      userId: user.id,
      ...(!withRedeemed && { redeemedBy: IsNull() }),
      ...(!withExpired && { validUntil: MoreThan(new Date()) }),
    },
    withDeleted,
    order: {
      createdAt: order,
    },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  })

  // The greetings of the page, read once for all its links. A deleted link -- the admin's
  // list may ask for those -- never shows one.
  const greetings = new Map(
    (
      await dbSelectThankYouGreetingsByLinkCodes(
        transactionLinks.filter((tl) => !tl.deletedAt).map((tl) => tl.code),
      )
    ).map((greeting) => [greeting.transactionLinkCode, new ThankYouGreeting(greeting)]),
  )

  return {
    count,
    links: transactionLinks.map((tl) => {
      const now = new Date()
      if (withExpired && now >= tl.validUntil) {
        tl.holdAvailableAmount = tl.amount
      } else {
        tl.holdAvailableAmount = tl.holdAvailableAmount.decayed(tl.createdAt, now)
      }
      return new TransactionLink(
        tl,
        new User(user),
        undefined,
        undefined,
        tl.deletedAt ? null : greetings.get(tl.code),
      )
    }),
  }
}
