/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Resolver, Args, Authorized, Ctx, Mutation } from 'type-graphql'
import { getCustomRepository, MoreThan } from '@dbTools/typeorm'
import { TransactionLink } from '@model/TransactionLink'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import TransactionLinkArgs from '@arg/TransactionLinkArgs'
import { UserRepository } from '@repository/User'
import { calculateBalance } from '@/util/validate'
import { RIGHTS } from '@/auth/RIGHTS'
import { randomBytes } from 'crypto'
import { User } from '@model/User'
import { calculateDecay } from '@/util/decay'

// TODO: do not export, test it inside the resolver
export const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}

const transactionLinkExpireDate = (date: Date): Date => {
  const validUntil = new Date(date)
  // valid for 14 days
  return new Date(validUntil.setDate(date.getDate() + 14))
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

    const createdDate = new Date()
    const validUntil = transactionLinkExpireDate(createdDate)

    const holdAvailableAmount = amount.add(
      calculateDecay(amount, createdDate, validUntil).decay.mul(-1),
    )

    const openTransactionLinks = await dbTransactionLink.find({
      select: ['holdAvailableAmount'],
      where: { userId: user.id, redeemedAt: null, validUntil: MoreThan(createdDate) },
    })

    const holdAvailable = openTransactionLinks.reduce(
      (previousValue, currentValue) =>
        previousValue.add(currentValue.holdAvailableAmount.toString()),
      holdAvailableAmount,
    )

    // validate amount
    // TODO taken from transaction resolver, duplicate code
    const sendBalance = await calculateBalance(user.id, holdAvailable.mul(-1), createdDate)
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
    transactionLink.showEmail = showEmail
    await dbTransactionLink.save(transactionLink).catch((error) => {
      throw error
    })

    return new TransactionLink(transactionLink, new User(user))
  }
}
