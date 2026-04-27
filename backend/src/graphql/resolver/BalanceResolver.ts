import { Balance } from '@model/Balance'
import {
  Transaction as dbTransaction,
  TransactionLink as dbTransactionLink,
  getLastTransaction,
} from 'database'
import { getLogger } from 'log4js'
import { GradidoUnit, TemporalGradidoUnit } from 'shared'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { IsNull } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { BalanceLoggingView } from '@/logging/BalanceLogging.view'
import { DecayLoggingView } from '@/logging/DecayLogging.view'
import { Context, getUser } from '@/server/context'
import { GdtResolver } from './GdtResolver'
import { transactionLinkSummary } from './util/transactionLinkSummary'

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
      })
    }

    const count =
      context.transactionCount || context.transactionCount === 0
        ? context.transactionCount
        : await dbTransaction.count({ where: { userId: user.id } })

    logger.debug(`transactionCount=${count}`)

    const linkCount = await dbTransactionLink.count({
      where: {
        userId: user.id,
        redeemedAt: IsNull(),
        // validUntil: MoreThan(new Date()),
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

    // The final balance is reduced by the link amount withheld
    // TODO: calculate also decay for open links
    const { sumHoldAvailableAmount } = context.sumHoldAvailableAmount
      ? { sumHoldAvailableAmount: context.sumHoldAvailableAmount }
      : await transactionLinkSummary(user.id, now)

    logger.debug(`context.sumHoldAvailableAmount=${context.sumHoldAvailableAmount}`)
    logger.debug(`sumHoldAvailableAmount=${sumHoldAvailableAmount}`)

    const balance = calculatedDecay.balance.subtract(sumHoldAvailableAmount).toDecimalPlaces(2)

    // const newBalance = new Balance({
    //      balance: calculatedDecay.balance
    //        .minus(sumHoldAvailableAmount.toString())
    //        .toDecimalPlaces(2, Decimal.ROUND_DOWN),
    const newBalance = new Balance({
      balance,
      balanceGDT,
      count,
      linkCount,
    })
    logger.info(
      'new Balance',
      balance.toString(),
      balanceGDT?.toString(),
      count,
      linkCount,
      new BalanceLoggingView(newBalance),
    )

    return newBalance
  }
}
