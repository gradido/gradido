import { Balance } from '@model/Balance'
import { transactionLinksDecayed } from 'core'
import {
  Transaction as dbTransaction,
  TransactionLink as dbTransactionLink,
  getLastTransaction,
} from 'database'
import { getLogger } from 'log4js'
import { GradidoUnit } from 'shared'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { IsNull } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { BalanceLoggingView } from '@/logging/BalanceLogging.view'
import { DecayLoggingView } from '@/logging/DecayLogging.view'
import { Context, getUser } from '@/server/context'
import { GdtResolver } from './GdtResolver'

@Resolver()
export class BalanceResolver {
  @Authorized([RIGHTS.BALANCE])
  @Query(() => Balance)
  async balance(@Ctx() context: Context): Promise<Balance> {
    const user = getUser(context)
    const now = new Date()
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.BalanceResolver`)

    logger.addContext('user', user.id)
    logger.info(`balance...`)

    let balanceGDT
    if (!context.balanceGDT) {
      const gdtResolver = new GdtResolver()
      balanceGDT = await gdtResolver.gdtBalance(context)
    } else {
      balanceGDT = context.balanceGDT
    }

    logger.debug(`balanceGDT=${context.balanceGDT}`)

    const lastTransaction = context.lastTransaction
      ? context.lastTransaction
      : await getLastTransaction(user.id)

    logger.debug(`lastTransaction=${lastTransaction}`)

    // No balance found
    if (!lastTransaction) {
      logger.info(`no balance found, return Default-Balance!`)
      return new Balance({
        balance: new GradidoUnit(0n),
        balanceGDT,
        count: 0,
        linkCount: 0,
        openLinkCount: 0,
      })
    }

    const count =
      context.transactionCount || context.transactionCount === 0
        ? context.transactionCount
        : await dbTransaction.count({ where: { userId: user.id } })

    logger.debug(`transactionCount=${count}`)

    // Deliberately unfiltered by validUntil: this is the number the list of links pages
    // against, and that list shows the expired ones as well. The count of links that can
    // still be redeemed is openLinkCount below.
    const linkCount = await dbTransactionLink.count({
      where: {
        userId: user.id,
        redeemedAt: IsNull(),
      },
    })
    logger.debug(`linkCount=${linkCount}`)

    // The decay is always calculated on the last booked transaction
    const calculatedDecay = lastTransaction.balance.calculateDecay(lastTransaction.balanceDate, now)
    logger.info(
      'calculatedDecay',
      lastTransaction.balance.toString(),
      lastTransaction.balanceDate.toISOString(),
      new DecayLoggingView(calculatedDecay),
    )

    // The final balance is reduced by the link amount decayed. The same call already counts
    // the links it sums up - those are the open ones, so openLinkCount comes for free here.
    const { sumHoldAvailableDecayedAmount, transactionLinkCount } =
      context.sumHoldAvailableDecayedAmount && context.linkCount !== undefined
        ? {
            sumHoldAvailableDecayedAmount: context.sumHoldAvailableDecayedAmount,
            transactionLinkCount: context.linkCount,
          }
        : await transactionLinksDecayed(user.id, now)

    logger.debug(`context.sumHoldAvailableDecayedAmount=${context.sumHoldAvailableDecayedAmount}`)
    logger.debug(`sumHoldAvailableDecayedAmount=${sumHoldAvailableDecayedAmount}`)

    const balance = calculatedDecay.balance
      .subtract(sumHoldAvailableDecayedAmount)
      .toDecimalPlaces(2)

    // const newBalance = new Balance({
    //      balance: calculatedDecay.balance
    //        .minus(sumHoldAvailableAmount.toString())
    //        .toDecimalPlaces(2, Decimal.ROUND_DOWN),
    const newBalance = new Balance({
      balance,
      balanceGDT,
      count,
      linkCount,
      openLinkCount: transactionLinkCount,
    })
    logger.info(
      'new Balance',
      balance.toString(),
      balanceGDT?.toString(),
      count,
      linkCount,
      transactionLinkCount,
      new BalanceLoggingView(newBalance),
    )

    return newBalance
  }
}
