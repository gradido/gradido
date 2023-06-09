/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { getCustomRepository } from '@dbTools/typeorm'
import { Transaction as dbTransaction } from '@entity/Transaction'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { Decimal } from 'decimal.js-light'
import { Resolver, Query, Ctx, Authorized } from 'type-graphql'

import { Balance } from '@model/Balance'
import { TransactionLinkRepository } from '@repository/TransactionLink'

import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { calculateDecay } from '@/util/decay'

import { GdtResolver } from './GdtResolver'
import { getLastTransaction } from './util/getLastTransaction'

@Resolver()
export class BalanceResolver {
  @Authorized([RIGHTS.BALANCE])
  @Query(() => Balance)
  async balance(@Ctx() context: Context): Promise<Balance> {
    const user = getUser(context)
    const now = new Date()

    logger.addContext('user', user.id)
    logger.info(`balance(userId=${user.id})...`)

    const gdtResolver = new GdtResolver()
    const balanceGDT = await gdtResolver.gdtBalance(context)
    logger.debug(`balanceGDT=${balanceGDT}`)

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
        redeemedAt: null,
        // validUntil: MoreThan(new Date()),
      },
    })
    logger.debug(`linkCount=${linkCount}`)

    // The decay is always calculated on the last booked transaction
    const calculatedDecay = calculateDecay(
      lastTransaction.balance,
      lastTransaction.balanceDate,
      now,
    )
    logger.info(
      'calculatedDecay',
      lastTransaction.balance,
      lastTransaction.balanceDate,
      calculatedDecay,
    )

    // The final balance is reduced by the link amount withheld
    const transactionLinkRepository = getCustomRepository(TransactionLinkRepository)
    const { sumHoldAvailableAmount } = context.sumHoldAvailableAmount
      ? { sumHoldAvailableAmount: context.sumHoldAvailableAmount }
      : await transactionLinkRepository.summary(user.id, now)

    logger.debug(`context.sumHoldAvailableAmount=${context.sumHoldAvailableAmount}`)
    logger.debug(`sumHoldAvailableAmount=${sumHoldAvailableAmount}`)

    const balance = calculatedDecay.balance
      .minus(sumHoldAvailableAmount.toString())
      .toDecimalPlaces(2, Decimal.ROUND_DOWN) // round towards zero

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
    logger.info('new Balance', balance, balanceGDT, count, linkCount, newBalance)

    return newBalance
  }
}
