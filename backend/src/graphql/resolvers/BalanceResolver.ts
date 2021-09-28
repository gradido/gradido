/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import CONFIG from '../../config'
import { Balance } from '../models/Balance'
import { apiGet } from '../../apis/HttpRequest'
import { User as dbUser } from '../../typeorm/entity/User'
import { Balance as dbBalance } from '../../typeorm/entity/Balance'
import calculateDecay from '../../util/decay'
import { roundFloorFrom4 } from '../../util/round'

@Resolver()
export class BalanceResolver {
  @Authorized()
  @Query(() => Balance)
  async balance(@Ctx() context: any): Promise<Balance> {
    // get public key for current logged in user
    const result = await apiGet(CONFIG.LOGIN_API_URL + 'login?session_id=' + context.sessionId)
    if (!result.success) throw new Error(result.data)

    // load user and balance
    const userEntity = await dbUser
      .createQueryBuilder('user')
      .where('hex(user.pubkey) = :pubkeyHex', { pubkeyHex: result.data.user.public_hex })
      .getOneOrFail()
    const balanceEntity = await dbBalance.findOneOrFail({ where: { userId: userEntity.id } })
    const now = new Date()
    const balance = new Balance({
      balance: roundFloorFrom4(balanceEntity.amount),
      decay: roundFloorFrom4(calculateDecay(balanceEntity.amount, balanceEntity.recordDate, now)),
      decay_date: now.toString(),
    })

    return balance
  }
}
