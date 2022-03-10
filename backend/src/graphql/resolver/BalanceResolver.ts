/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import { getCustomRepository } from '@dbTools/typeorm'
import { Balance } from '@model/Balance'
import { UserRepository } from '@repository/User'
import { calculateDecay } from '@/util/decay'
import { RIGHTS } from '@/auth/RIGHTS'
import { Transaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'

@Resolver()
export class BalanceResolver {
  @Authorized([RIGHTS.BALANCE])
  @Query(() => Balance)
  async balance(@Ctx() context: any): Promise<Balance> {
    // load user and balance
    const userRepository = getCustomRepository(UserRepository)

    const user = await userRepository.findByPubkeyHex(context.pubKey)
    const now = new Date()

    const lastTransaction = await Transaction.findOne(
      { userId: user.id },
      { order: { balanceDate: 'DESC' } },
    )

    // No balance found
    if (!lastTransaction) {
      return new Balance({
        balance: new Decimal(0),
        decay: new Decimal(0),
        decay_date: now.toString(),
      })
    }

    return new Balance({
      balance: lastTransaction.balance,
      decay: calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, now).balance,
      decay_date: now.toString(),
    })
  }
}
