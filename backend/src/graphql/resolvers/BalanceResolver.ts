/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Ctx, Authorized } from 'type-graphql'
import CONFIG from '../../config'
import { Balance } from '../models/Balance'
import { apiGet } from '../../apis/HttpRequest'

@Resolver()
export class BalanceResolver {
  @Authorized()
  @Query(() => Balance)
  async balance(@Ctx() context: any): Promise<Balance> {
    const result = await apiGet(CONFIG.COMMUNITY_API_URL + 'getBalance/' + context.sessionId)
    if (!result.success) throw new Error(result.data)
    return new Balance(result.data)
  }
}
