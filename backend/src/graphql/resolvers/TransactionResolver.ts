import { Resolver, Query, /* Mutation, */ Args } from 'type-graphql'
import CONFIG from '../../config'
import { TransactionList } from '../models/Transaction'
import { TransactionListInput, TransactionSendArgs } from '../inputs/TransactionInput'
import { apiGet, apiPost } from '../../apis/loginAPI'
import { GdtEntryList } from '../models/GdtEntryList'
import { GdtTransactionSessionIdInput } from '../inputs/GdtInputs'

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

  @Query(() => GdtEntryList)
  async gdtTransactionList(
    @Args()
    { sessionId, currentPage = 1, pageSize = 25, order = 'DESC' }: GdtTransactionSessionIdInput,
  ): Promise<GdtEntryList> {
    const result = await apiGet(
      `${CONFIG.COMMUNITY_API_URL}listGDTTransactions/${currentPage}/${pageSize}/${order}/${sessionId}`,
    )
    if (!result.success) {
      throw new Error(result.data)
    }
    return new GdtEntryList(result.data)
  }

  @Query(() => String)
  async sendCoins(
    @Args() { sessionId, email, amount, memo }: TransactionSendArgs,
  ): Promise<string> {
    const payload = {
      session_id: sessionId,
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
