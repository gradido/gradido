/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Args, Arg, Authorized, Ctx, Mutation, Query } from 'type-graphql'
import { getCustomRepository } from '@dbTools/typeorm'
import { TransactionLink } from '@model/TransactionLink'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { User as dbUser } from '@entity/User'
import { UserRepository } from '@repository/User'
import TransactionLinkArgs from '@arg/TransactionLinkArgs'
import Paginated from '@arg/Paginated'
import { calculateBalance } from '@/util/validate'
import { RIGHTS } from '@/auth/RIGHTS'
import { randomBytes } from 'crypto'
import { User } from '@model/User'
import { calculateDecay } from '@/util/decay'
import { executeTransaction } from './TransactionResolver'
import { User as dbUser } from '@entity/User'
import { Order } from '@enum/Order'

// TODO: do not export, test it inside the resolver
export const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}

const CODE_VALID_DAYS_DURATION = 14

const transactionLinkExpireDate = (date: Date): Date => {
  const validUntil = new Date(date)
  return new Date(validUntil.setDate(date.getDate() + CODE_VALID_DAYS_DURATION))
}

@Resolver()
export class TransactionLinkResolver {
  @Authorized([RIGHTS.CREATE_TRANSACTION_LINK])
  @Mutation(() => TransactionLink)
  async createTransactionLink(
    @Args() { amount, memo }: TransactionLinkArgs,
    @Ctx() context: any,
  ): Promise<TransactionLink> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByPubkeyHex(context.pubKey)

    const createdDate = new Date()
    const validUntil = transactionLinkExpireDate(createdDate)

    const holdAvailableAmount = amount.minus(calculateDecay(amount, createdDate, validUntil).decay)

    // validate amount
    const sendBalance = await calculateBalance(user.id, holdAvailableAmount.mul(-1), createdDate)
    if (!sendBalance) {
      throw new Error("user hasn't enough GDD or amount is < 0")
    }

    const transactionLink = dbTransactionLink.create()
    transactionLink.userId = user.id
    transactionLink.amount = amount
    transactionLink.memo = memo
    transactionLink.holdAvailableAmount = holdAvailableAmount
    transactionLink.code = transactionLinkCode(createdDate)
    transactionLink.createdAt = createdDate
    transactionLink.validUntil = validUntil
    await dbTransactionLink.save(transactionLink).catch(() => {
      throw new Error('Unable to save transaction link')
    })

    return new TransactionLink(transactionLink, new User(user))
  }

  @Authorized([RIGHTS.DELETE_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async deleteTransactionLink(@Arg('id') id: number, @Ctx() context: any): Promise<boolean> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByPubkeyHex(context.pubKey)

    const transactionLink = await dbTransactionLink.findOne({ id })
    if (!transactionLink) {
      throw new Error('Transaction Link not found!')
    }

    if (transactionLink.userId !== user.id) {
      throw new Error('Transaction Link cannot be deleted!')
    }

    if (transactionLink.redeemedBy) {
      throw new Error('Transaction Link already redeemed!')
    }

    await transactionLink.softRemove().catch(() => {
      throw new Error('Transaction Link could not be deleted!')
    })

    return true
  }

  @Authorized([RIGHTS.QUERY_TRANSACTION_LINK])
  @Query(() => TransactionLink)
  async queryTransactionLink(@Arg('code') code: string): Promise<TransactionLink> {
    const transactionLink = await dbTransactionLink.findOneOrFail({ code })
    const user = await dbUser.findOneOrFail({ id: transactionLink.userId })
    let redeemedBy: User | null = null
    if (transactionLink && transactionLink.redeemedBy) {
      redeemedBy = new User(await dbUser.findOneOrFail({ id: transactionLink.redeemedBy }))
    }
    return new TransactionLink(transactionLink, new User(user), redeemedBy)
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS])
  @Query(() => [TransactionLink])
  async listTransactionLinks(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Ctx() context: any,
  ): Promise<TransactionLink[]> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByPubkeyHex(context.pubKey)
    // const now = new Date()
    const transactionLinks = await dbTransactionLink.find({
      where: {
        userId: user.id,
        redeemedBy: null,
        // validUntil: MoreThan(now),
      },
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })
    return transactionLinks.map((tl) => new TransactionLink(tl, new User(user)))
  }

  @Authorized([RIGHTS.REDEEM_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async redeemTransactionLink(@Arg('id') id: number, @Ctx() context: any): Promise<boolean> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByPubkeyHex(context.pubKey)
    const transactionLink = await dbTransactionLink.findOneOrFail({ id })
    const linkedUser = await dbUser.findOneOrFail({ id: transactionLink.userId })

    const now = new Date()

    if (user.id === linkedUser.id) {
      throw new Error('Cannot redeem own transaction link.')
    }

    if (transactionLink.validUntil.getTime() < now.getTime()) {
      throw new Error('Transaction Link is not valid anymore.')
    }

    if (transactionLink.redeemedBy) {
      throw new Error('Transaction Link already redeemed.')
    }

    await executeTransaction(transactionLink.amount, transactionLink.memo, linkedUser, user)

    transactionLink.redeemedAt = now
    transactionLink.redeemedBy = user.id
    transactionLink.save().catch(() => {
      throw new Error('Could not update transaction link.')
    })

    return true
  }
}
