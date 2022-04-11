import { Context, getUser } from '@/server/context'
import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import { Balance } from '@model/Balance'
import { calculateDecay } from '@/util/decay'
import { RIGHTS } from '@/auth/RIGHTS'
import { Transaction as dbTransaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { GdtResolver } from './GdtResolver'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { MoreThan, getCustomRepository } from '@dbTools/typeorm'
import { TransactionLinkRepository } from '@repository/TransactionLink'

@Resolver()
export class BalanceResolver {
  @Authorized([RIGHTS.BALANCE])
  @Query(() => Balance)
  async balance(@Ctx() context: Context): Promise<Balance> {
    const user = getUser(context)
    const now = new Date()

    const gdtResolver = new GdtResolver()
    const balanceGDT = await gdtResolver.gdtBalance(context)

    const lastTransaction = context.lastTransaction
      ? context.lastTransaction
      : await dbTransaction.findOne({ userId: user.id }, { order: { balanceDate: 'DESC' } })

    // No balance found
    if (!lastTransaction) {
      return new Balance({
        balance: new Decimal(0),
        decay: new Decimal(0),
        lastBookedBalance: new Decimal(0),
        balanceGDT,
        count: 0,
        linkCount: 0,
      })
    }

    const count =
      context.transactionCount || context.transactionCount === 0
        ? context.transactionCount
        : await dbTransaction.count({ where: { userId: user.id } })
    const linkCount =
      context.linkCount || context.linkCount === 0
        ? context.linkCount
        : await dbTransactionLink.count({
            where: {
              userId: user.id,
              redeemedAt: null,
              validUntil: MoreThan(new Date()),
            },
          })

    // The decay is always calculated on the last booked transaction
    const calculatedDecay = calculateDecay(
      lastTransaction.balance,
      lastTransaction.balanceDate,
      now,
    )

    // The final balance is reduced by the link amount withheld
    const transactionLinkRepository = getCustomRepository(TransactionLinkRepository)
    const { sumHoldAvailableAmount } = context.sumHoldAvailableAmount
      ? { sumHoldAvailableAmount: context.sumHoldAvailableAmount }
      : await transactionLinkRepository.summary(user.id, now)

    return new Balance({
      balance: calculatedDecay.balance
        .minus(sumHoldAvailableAmount.toString())
        .toDecimalPlaces(2, Decimal.ROUND_DOWN), // round towards zero
      decay: calculatedDecay.decay.toDecimalPlaces(2, Decimal.ROUND_FLOOR), // round towards - infinity
      lastBookedBalance: lastTransaction.balance.toDecimalPlaces(2, Decimal.ROUND_DOWN),
      balanceGDT,
      count,
      linkCount,
      lastBookedDate: lastTransaction.balanceDate,
    })
  }
}
