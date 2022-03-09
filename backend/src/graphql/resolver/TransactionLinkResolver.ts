/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Args, Authorized, Ctx, Mutation, Query, Arg } from 'type-graphql'
import { getCustomRepository } from '@dbTools/typeorm'
import { TransactionLink } from '@model/TransactionLink'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import TransactionLinkArgs from '@arg/TransactionLinkArgs'
import { UserRepository } from '@repository/User'
import { calculateBalance } from '@/util/validate'
import { RIGHTS } from '@/auth/RIGHTS'
import { randomBytes } from 'crypto'
import { User } from '@model/User'

// TODO: do not export, test it inside the resolver
export const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(48)
      .toString('hex')
      .substring(0, 96 - time.length) + time
  )
}

const transactionLinkExpireDate = (date: Date): Date => {
  // valid for 14 days
  return new Date(date.setDate(date.getDate() + 14))
}

@Resolver()
export class TransactionLinkResolver {
  @Authorized([RIGHTS.CREATE_TRANSACTION_LINK])
  @Mutation(() => TransactionLink)
  async createTransactionLink(
    @Args() { amount, memo, showEmail = false }: TransactionLinkArgs,
    @Ctx() context: any,
  ): Promise<TransactionLink> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByPubkeyHex(context.pubKey)

    // validate amount
    // TODO taken from transaction resolver, duplicate code
    const createdDate = new Date()
    const sendBalance = await calculateBalance(user.id, amount.mul(-1), createdDate)
    if (!sendBalance) {
      throw new Error("user hasn't enough GDD or amount is < 0")
    }

    // TODO!!!! Test balance for pending transaction links

    const transactionLink = dbTransactionLink.create()
    transactionLink.userId = user.id
    transactionLink.amount = amount
    transactionLink.memo = memo
    transactionLink.code = transactionLinkCode(createdDate)
    transactionLink.createdAt = createdDate
    transactionLink.validUntil = transactionLinkExpireDate(createdDate)
    transactionLink.showEmail = showEmail
    await dbTransactionLink.save(transactionLink).catch((error) => {
      throw error
    })

    return new TransactionLink(transactionLink, new User(user))
  }

  @Authorized([RIGHTS.QUERY_TRANSACTION_LINK])
  @Query(() => TransactionLink)
  async queryTransactionLink(@Arg('code') code: string): Promise<TransactionLink> {
    const transactionLink = await dbTransactionLink.findOneOrFail({ code })
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findOneOrFail({ id: transactionLink.userId })
    return new TransactionLink(transactionLink, new User(user))
  }
}
