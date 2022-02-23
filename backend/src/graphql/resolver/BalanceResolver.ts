/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import { getCustomRepository } from '@dbTools/typeorm'
import { Balance } from '../model/Balance'
import { UserRepository } from '../../typeorm/repository/User'
import { calculateDecay } from '../../util/decay'
import { roundFloorFrom4 } from '../../util/round'
import { RIGHTS } from '../../auth/RIGHTS'
import { Balance as dbBalance } from '@entity/Balance'

@Resolver()
export class BalanceResolver {
  @Authorized([RIGHTS.BALANCE])
  @Query(() => Balance)
  async balance(@Ctx() context: any): Promise<Balance> {
    // load user and balance
    const userRepository = getCustomRepository(UserRepository)

    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)
    const balanceEntity = await dbBalance.findOne({ userId: userEntity.id })
    const now = new Date()

    // No balance found
    if (!balanceEntity) {
      return new Balance({
        balance: 0,
        decay: 0,
        decay_date: now.toString(),
      })
    }

    return new Balance({
      balance: roundFloorFrom4(balanceEntity.amount),
      decay: roundFloorFrom4(
        calculateDecay(balanceEntity.amount, balanceEntity.recordDate, now).balance,
      ),
      decay_date: now.toString(),
    })
  }
}
