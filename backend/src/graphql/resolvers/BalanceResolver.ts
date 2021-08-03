import { Resolver, Query, /* Mutation, */ Args, Arg } from 'type-graphql'
import CONFIG from '../../config'
import { Balance } from '../models/Balance'
import { apiGet } from '../../apis/loginAPI'

@Resolver()
export class BalanceResolver {
  @Query(() => Balance)
  async balance(@Arg('sessionId') sessionId: number): Promise<Balance> {
    const result = await apiGet(CONFIG.COMMUNITY_API_URL + 'getBalance/' + sessionId)
    console.log(result)
    if (!result.success)
      throw new Error(result.data)
    return new Balance(result.data)
  }
}
