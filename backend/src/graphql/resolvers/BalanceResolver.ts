/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import { Balance } from '../models/Balance'
import { User as dbUser } from '../../typeorm/entity/User'
import { Balance as dbBalance } from '../../typeorm/entity/Balance'
import calculateDecay from '../../util/decay'
import { roundFloorFrom4 } from '../../util/round'

@Resolver()
export class BalanceResolver {
  @Authorized()
  @Query(() => Balance)
  async balance(@Ctx() context: any): Promise<Balance> {
    // load user and balance
    const userEntity = await dbUser.findByPubkeyHex(context.pubKey)
    const balanceEntity = await dbBalance.findByUser(userEntity.id)
    const now = new Date()
    return new Balance({
      balance: roundFloorFrom4(balanceEntity.amount),
      decay: roundFloorFrom4(
        await calculateDecay(balanceEntity.amount, balanceEntity.recordDate, now),
      ),
      decay_date: now.toString(),
    })
  }
}
