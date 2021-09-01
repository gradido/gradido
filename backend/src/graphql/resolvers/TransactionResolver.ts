/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Authorized, Ctx } from 'type-graphql'
import CONFIG from '../../config'
import { TransactionList } from '../models/Transaction'
import { TransactionListInput, TransactionSendArgs } from '../inputs/TransactionInput'
import { apiGet, apiPost } from '../../apis/loginAPI'

@Resolver()
export class TransactionResolver {
  @Authorized()
  @Query(() => TransactionList)
  async transactionList(
    @Args() { firstPage = 1, items = 25, order = 'DESC' }: TransactionListInput,
    @Ctx() context: any,
  ): Promise<TransactionList> {
    const result = await apiGet(
      `${CONFIG.COMMUNITY_API_URL}listTransactions/${firstPage}/${items}/${order}/${context.sessionId}`,
    )
    if (!result.success) throw new Error(result.data)
    return new TransactionList(result.data)
  }

  @Authorized()
  @Query(() => String)
  async sendCoins(
    @Args() { email, amount, memo }: TransactionSendArgs,
    @Ctx() context: any,
  ): Promise<string> {
    const payload = {
      session_id: context.sessionId,
      target_email: email,
      amount: amount * 10000,
      memo,
      auto_sign: true,
      transaction_type: 'transfer',
      blockchain_type: 'mysql',
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'createTransaction', payload)
    if (!result.success) {
      throw new Error(result.data)
    }
    return 'success'
  }
}
