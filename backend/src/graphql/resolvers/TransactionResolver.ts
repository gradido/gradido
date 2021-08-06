import { Resolver, Query, /* Mutation, */ Args } from 'type-graphql'
import CONFIG from '../../config'
import { TransactionList } from '../models/Transaction'
import { TransactionListInput, TransactionSendArgs } from '../inputs/TransactionInput'
import { apiGet, apiPost } from '../../apis/loginAPI'

@Resolver()
export class TransactionResolver {
  @Query(() => TransactionList)
  async transactionList(
    @Args() { sessionId, firstPage = 1, items = 25, order = 'DESC' }: TransactionListInput,
  ): Promise<TransactionList> {

    const result = await apiGet(
      `${CONFIG.COMMUNITY_API_URL}listTransactions/${firstPage}/${items}/${order}/${sessionId}`,
    )
    if (!result.success) throw new Error(result.data)
    return new TransactionList(result.data)
  }

  @Query(() => String)
  async sendCoins(
    @Args() { sessionId, email, amount, memo }: TransactionSendArgs,
  ): Promise<string> {
    const payload = {
      session_id: sessionId,
      email,
      amount,
      memo,
      auto_sign: true,
    }
    const result = await apiPost(CONFIG.COMMUNITY_API_URL + 'sendCoins', payload)
    if (!result.success) {
      throw new Error(result.data)
    }
    return 'success'
  }
}
