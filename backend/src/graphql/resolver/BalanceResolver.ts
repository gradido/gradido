import { Balance } from '@model/Balance'
import {
  Transaction as dbTransaction,
  TransactionLink as dbTransactionLink,
  getLastTransaction,
} from 'database'
import { Decimal } from 'decimal.js-light'
import { getLogger } from 'log4js'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { IsNull } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { BalanceLoggingView } from '@/logging/BalanceLogging.view'
import { Context, getUser } from '@/server/context'
import { GdtResolver } from './GdtResolver'
import { transactionLinkSummary } from './util/transactionLinkSummary'
import { GradidoUnit } from 'shared-native'

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
        balance: new Decimal(0),
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

    const lastTransactionBalance = new GradidoUnit(lastTransaction.balance.toString())
    lastTransactionBalance.decay(GradidoUnit.effectiveDecayDuration(lastTransaction.balanceDate, now))
    
    // The final balance is reduced by the link amount withheld
    // TODO: improve caching
    const { sumHoldAvailableAmount } = context.sumHoldAvailableAmount
      ? { sumHoldAvailableAmount: context.sumHoldAvailableAmount }
      : await transactionLinkSummary(user.id, now)

    logger.debug(`context.sumHoldAvailableAmount=${context.sumHoldAvailableAmount?.toString()}`)
    logger.debug(`sumHoldAvailableAmount=${sumHoldAvailableAmount.toString()}`)

    lastTransactionBalance.sub(sumHoldAvailableAmount)

    const newBalance = new Balance({
      balance: new Decimal(lastTransactionBalance.toString(2)),
      balanceGDT,
      count,
      linkCount,
    })
    logger.info(
      'new Balance',
      lastTransactionBalance.toString(),
      balanceGDT?.toString(),
      count,
      linkCount,
      new BalanceLoggingView(newBalance),
    )

    return newBalance
  }
}
