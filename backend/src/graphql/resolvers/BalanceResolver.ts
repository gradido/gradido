import { Resolver, Query, /* Mutation, */ Arg } from 'type-graphql'
import CONFIG from '../../config'
import { Balance } from '../models/Balance'
import { apiGet } from '../../apis/HttpRequest'

@Resolver()
export class BalanceResolver {
  @Query(() => Balance)
  async balance(@Arg('sessionId') sessionId: number): Promise<Balance> {
    const result = await apiGet(CONFIG.COMMUNITY_API_URL + 'getBalance/' + sessionId)
    if (!result.success) throw new Error(result.data)
    return new Balance(result.data)
  }
}
