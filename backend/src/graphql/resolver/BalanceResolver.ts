/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import { Balance } from '@model/Balance'
import { calculateDecay } from '@/util/decay'
import { RIGHTS } from '@/auth/RIGHTS'
import { Transaction, Transaction as dbTransaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { GdtResolver } from './GdtResolver'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { MoreThan } from '@dbTools/typeorm'

@Resolver()
export class BalanceResolver {
  @Authorized([RIGHTS.BALANCE])
  @Query(() => Balance)
  async balance(@Ctx() context: any): Promise<Balance> {
    const { user } = context
    const now = new Date()

    const gdtResolver = new GdtResolver()
    const balanceGDT = await gdtResolver.gdtSum(context)

    const lastTransaction = await Transaction.findOne(
      { userId: user.id },
      { order: { balanceDate: 'DESC' } },
    )

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

    const count = await dbTransaction.count({ where: { userId: user.id } })
    const linkCount = await dbTransactionLink.count({
      where: {
        userId: user.id,
        redeemedAt: null,
        validUntil: MoreThan(new Date()),
      },
    })

    const calculatedDecay = calculateDecay(
      lastTransaction.balance,
      lastTransaction.balanceDate,
      now,
    )

    return new Balance({
      balance: calculatedDecay.balance,
      decay: calculatedDecay.decay,
      lastBookedBalance: lastTransaction.balance,
      balanceGDT,
      count,
      linkCount,
      lastBookedDate: lastTransaction.balanceDate,
    })
  }
}
