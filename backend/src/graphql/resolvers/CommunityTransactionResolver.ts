import { Resolver, Query, /* Mutation, */ Args, Arg } from 'type-graphql'
import CONFIG from '../../config'
import {} from '../models/Transaction'
import {
  TransactionCreateArgs,
  TransactionInput,
  TransactionSendArgs,
} from '../inputs/TransactionInput'
import { apiPost, apiGet } from '../../apis/loginAPI'

@Resolver()
export class CommunityTransactionResolver {
  @Query(() => String)
  async balance(@Arg('sessionId') sessionId: number): Promise<any> {
    // eslint-disable-next-line no-console
    console.log('IN BALANCE: URL: ' + CONFIG.COMMUNITY_API_URL + 'getBalance/' + sessionId)
    return apiGet(CONFIG.COMMUNITY_API_URL + 'getBalance/' + sessionId)
  }

  @Query(() => String)
  async transactions(
    @Args() { sessionId, firstPage = 1, items = 5, order = 'DESC' }: TransactionInput,
  ): Promise<any> {
    return apiGet(
      `${CONFIG.COMMUNITY_API_URL}listTransactions/${firstPage}/${items}/${order}/${sessionId}`,
    )
  }

  @Query(() => String)
  async send(@Args() { sessionId, email, amount, memo }: TransactionSendArgs): Promise<any> {
    const payload = {
      session_id: sessionId,
      auto_sign: true,
      email: email,
      amount: amount,
      memo: memo,
    }
    return apiPost(CONFIG.COMMUNITY_API_URL + 'sendCoins/', payload)
  }

  @Query(() => String)
  async create(
    @Args() { sessionId, email, amount, memo, targetDate = new Date() }: TransactionCreateArgs,
  ): Promise<any> {
    const payload = {
      sessionId,
      email,
      amount,
      targetDate,
      memo,
      auto_sign: true,
    }
    return apiPost(CONFIG.COMMUNITY_API_URL + 'createCoins/', payload)
  }
}
