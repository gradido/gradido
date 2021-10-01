/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Query, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import CONFIG from '../../config'
import { TransactionList } from '../models/Transaction'
import { TransactionListInput, TransactionSendArgs } from '../inputs/TransactionInput'
import { apiGet, apiPost } from '../../apis/HttpRequest'
import { User as dbUser } from '../../typeorm/entity/User'
import { Balance as dbBalance } from '../../typeorm/entity/Balance'
import listTransactions from './listTransactions'
import { roundFloorFrom4 } from '../../util/round'
import { calculateDecay } from '../../util/decay'

@Resolver()
export class TransactionResolver {
  @Authorized()
  @Query(() => TransactionList)
  async transactionList(
    @Args() { firstPage = 1, items = 25, order = 'DESC' }: TransactionListInput,
    @Ctx() context: any,
  ): Promise<TransactionList> {
    // get public key for current logged in user
    const result = await apiGet(CONFIG.LOGIN_API_URL + 'login?session_id=' + context.sessionId)
    if (!result.success) throw new Error(result.data)

    // load user
    const userEntity = await dbUser.findByPubkeyHex(result.data.user.public_hex)

    const transactions = await listTransactions(firstPage, items, order, userEntity)

    // get gdt sum
    const resultGDTSum = await apiPost(`${CONFIG.GDT_API_URL}/GdtEntries/sumPerEmailApi`, {
      email: userEntity.email,
    })
    if (!resultGDTSum.success) throw new Error(resultGDTSum.data)
    transactions.gdtSum = resultGDTSum.data.sum

    // get balance
    const balanceEntity = await dbBalance.findByUser(userEntity.id)
    if (balanceEntity) {
      const now = new Date()
      transactions.balance = roundFloorFrom4(balanceEntity.amount)
      transactions.decay = roundFloorFrom4(
        await calculateDecay(balanceEntity.amount, balanceEntity.recordDate, now),
      )
      transactions.decayDate = now.toString()
    }

    return transactions
  }

  @Authorized()
  @Mutation(() => String)
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
