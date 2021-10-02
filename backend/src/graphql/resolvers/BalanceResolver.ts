/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import { getCustomRepository } from 'typeorm'
import { Balance } from '../models/Balance'
import { BalanceRepository } from '../../typeorm/repository/Balance'
import { UserRepository } from '../../typeorm/repository/User'
import { calculateDecay } from '../../util/decay'
import { roundFloorFrom4 } from '../../util/round'

@Resolver()
export class BalanceResolver {
  @Authorized()
  @Query(() => Balance)
  async balance(@Ctx() context: any): Promise<Balance> {
    // load user and balance
    const balanceRepository = getCustomRepository(BalanceRepository)
    const userRepository = getCustomRepository(UserRepository)

    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)
    const balanceEntity = await balanceRepository.findByUser(userEntity.id)
    let balance: Balance
    const now = new Date()
    if (balanceEntity) {
      balance = new Balance({
        balance: roundFloorFrom4(balanceEntity.amount),
        decay: roundFloorFrom4(
          await calculateDecay(balanceEntity.amount, balanceEntity.recordDate, now),
        ),
        decay_date: now.toString(),
      })
    } else {
      balance = new Balance({
        balance: 0,
        decay: 0,
        decay_date: now.toString(),
      })
    }
    return balance
  }
}
