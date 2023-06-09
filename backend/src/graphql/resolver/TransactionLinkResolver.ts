import { randomBytes } from 'crypto'

import { getConnection } from '@dbTools/typeorm'
import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { User as DbUser } from '@entity/User'
import { Decimal } from 'decimal.js-light'
import { Resolver, Args, Arg, Authorized, Ctx, Mutation, Query, Int } from 'type-graphql'

import { Paginated } from '@arg/Paginated'
import { TransactionLinkArgs } from '@arg/TransactionLinkArgs'
import { TransactionLinkFilters } from '@arg/TransactionLinkFilters'
import { ContributionCycleType } from '@enum/ContributionCycleType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { ContributionLink } from '@model/ContributionLink'
import { Decay } from '@model/Decay'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'
import { User } from '@model/User'
import { QueryLinkResult } from '@union/QueryLinkResult'

import { RIGHTS } from '@/auth/RIGHTS'
import {
  EVENT_CONTRIBUTION_LINK_REDEEM,
  EVENT_TRANSACTION_LINK_CREATE,
  EVENT_TRANSACTION_LINK_DELETE,
  EVENT_TRANSACTION_LINK_REDEEM,
} from '@/event/Events'
import { Context, getUser, getClientTimezoneOffset } from '@/server/context'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { calculateDecay } from '@/util/decay'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import { fullName } from '@/util/utilities'
import { calculateBalance } from '@/util/validate'

import { executeTransaction } from './TransactionResolver'
import { getUserCreation, validateContribution } from './util/creations'
import { getLastTransaction } from './util/getLastTransaction'
import { transactionLinkList } from './util/transactionLinkList'

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

export const transactionLinkExpireDate = (date: Date): Date => {
  const validUntil = new Date(date)
  return new Date(validUntil.setDate(date.getDate() + CODE_VALID_DAYS_DURATION))
}

@Resolver()
export class TransactionLinkResolver {
  @Authorized([RIGHTS.CREATE_TRANSACTION_LINK])
  @Mutation(() => TransactionLink)
  async createTransactionLink(
    @Args() { amount, memo }: TransactionLinkArgs,
    @Ctx() context: Context,
  ): Promise<TransactionLink> {
    const user = getUser(context)

    const createdDate = new Date()
    const validUntil = transactionLinkExpireDate(createdDate)

    if (amount.lessThanOrEqualTo(0)) {
      throw new LogError('Amount must be a positive number', amount)
    }

    const holdAvailableAmount = amount.minus(calculateDecay(amount, createdDate, validUntil).decay)

    // validate amount
    const sendBalance = await calculateBalance(user.id, holdAvailableAmount.mul(-1), createdDate)
    if (!sendBalance) {
      throw new LogError('User has not enough GDD', user.id)
    }

    const transactionLink = DbTransactionLink.create()
    transactionLink.userId = user.id
    transactionLink.amount = amount
    transactionLink.memo = memo
    transactionLink.holdAvailableAmount = holdAvailableAmount
    transactionLink.code = transactionLinkCode(createdDate)
    transactionLink.createdAt = createdDate
    transactionLink.validUntil = validUntil
    await DbTransactionLink.save(transactionLink).catch((e) => {
      throw new LogError('Unable to save transaction link', e)
    })
    await EVENT_TRANSACTION_LINK_CREATE(user, transactionLink, amount)

    return new TransactionLink(transactionLink, new User(user))
  }

  @Authorized([RIGHTS.DELETE_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async deleteTransactionLink(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)

    const transactionLink = await DbTransactionLink.findOne({ id })
    if (!transactionLink) {
      throw new LogError('Transaction link not found', id)
    }

    if (transactionLink.userId !== user.id) {
      throw new LogError(
        'Transaction link cannot be deleted by another user',
        transactionLink.userId,
        user.id,
      )
    }

    if (transactionLink.redeemedBy) {
      throw new LogError('Transaction link already redeemed', transactionLink.redeemedBy)
    }

    await transactionLink.softRemove().catch((e) => {
      throw new LogError('Transaction link could not be deleted', e)
    })

    await EVENT_TRANSACTION_LINK_DELETE(user, transactionLink)

    return true
  }

  @Authorized([RIGHTS.QUERY_TRANSACTION_LINK])
  @Query(() => QueryLinkResult)
  async queryTransactionLink(@Arg('code') code: string): Promise<typeof QueryLinkResult> {
    if (code.match(/^CL-/)) {
      const contributionLink = await DbContributionLink.findOneOrFail(
        { code: code.replace('CL-', '') },
        { withDeleted: true },
      )
      return new ContributionLink(contributionLink)
    } else {
      const transactionLink = await DbTransactionLink.findOneOrFail({ code }, { withDeleted: true })
      const user = await DbUser.findOneOrFail({ id: transactionLink.userId })
      let redeemedBy: User | null = null
      if (transactionLink?.redeemedBy) {
        redeemedBy = new User(await DbUser.findOneOrFail({ id: transactionLink.redeemedBy }))
      }
      return new TransactionLink(transactionLink, new User(user), redeemedBy)
    }
  }

  @Authorized([RIGHTS.REDEEM_TRANSACTION_LINK])
  @Mutation(() => Boolean)
  async redeemTransactionLink(
    @Arg('code', () => String) code: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const user = getUser(context)

    if (code.match(/^CL-/)) {
      // acquire lock
      const releaseLock = await TRANSACTIONS_LOCK.acquire()
      try {
        logger.info('redeem contribution link...')
        const now = new Date()
        const queryRunner = getConnection().createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction('REPEATABLE READ')
        try {
          const contributionLink = await queryRunner.manager
            .createQueryBuilder()
            .select('contributionLink')
            .from(DbContributionLink, 'contributionLink')
            .where('contributionLink.code = :code', { code: code.replace('CL-', '') })
            .getOne()
          if (!contributionLink) {
            throw new LogError('No contribution link found to given code', code)
          }
          logger.info('...contribution link found with id', contributionLink.id)
          if (new Date(contributionLink.validFrom).getTime() > now.getTime()) {
            throw new LogError('Contribution link is not valid yet', contributionLink.validFrom)
          }
          if (contributionLink.validTo) {
            if (new Date(contributionLink.validTo).setHours(23, 59, 59) < now.getTime()) {
              throw new LogError('Contribution link is no longer valid', contributionLink.validTo)
            }
          }
          let alreadyRedeemed: DbContribution | undefined
          switch (contributionLink.cycle) {
            case ContributionCycleType.ONCE: {
              alreadyRedeemed = await queryRunner.manager
                .createQueryBuilder()
                .select('contribution')
                .from(DbContribution, 'contribution')
                .where('contribution.contributionLinkId = :linkId AND contribution.userId = :id', {
                  linkId: contributionLink.id,
                  id: user.id,
                })
                .getOne()
              if (alreadyRedeemed) {
                throw new LogError('Contribution link already redeemed', user.id)
              }
              break
            }
            case ContributionCycleType.DAILY: {
              const start = new Date()
              start.setHours(0, 0, 0, 0)
              const end = new Date()
              end.setHours(23, 59, 59, 999)
              alreadyRedeemed = await queryRunner.manager
                .createQueryBuilder()
                .select('contribution')
                .from(DbContribution, 'contribution')
                .where(
                  `contribution.contributionLinkId = :linkId AND contribution.userId = :id
                        AND Date(contribution.confirmedAt) BETWEEN :start AND :end`,
                  {
                    linkId: contributionLink.id,
                    id: user.id,
                    start,
                    end,
                  },
                )
                .getOne()
              if (alreadyRedeemed) {
                throw new LogError('Contribution link already redeemed today', user.id)
              }
              break
            }
            default: {
              throw new LogError('Contribution link has unknown cycle', contributionLink.cycle)
            }
          }

          const creations = await getUserCreation(user.id, clientTimezoneOffset)
          logger.info('open creations', creations)
          validateContribution(creations, contributionLink.amount, now, clientTimezoneOffset)
          const contribution = new DbContribution()
          contribution.userId = user.id
          contribution.createdAt = now
          contribution.contributionDate = now
          contribution.memo = contributionLink.memo
          contribution.amount = contributionLink.amount
          contribution.contributionLinkId = contributionLink.id
          contribution.contributionType = ContributionType.LINK
          contribution.contributionStatus = ContributionStatus.CONFIRMED

          await queryRunner.manager.insert(DbContribution, contribution)

          const lastTransaction = await getLastTransaction(user.id)
          let newBalance = new Decimal(0)

          let decay: Decay | null = null
          if (lastTransaction) {
            decay = calculateDecay(lastTransaction.balance, lastTransaction.balanceDate, now)
            newBalance = decay.balance
          }
          newBalance = newBalance.add(contributionLink.amount.toString())

          const transaction = new DbTransaction()
          transaction.typeId = TransactionTypeId.CREATION
          transaction.memo = contribution.memo
          transaction.userId = contribution.userId
          transaction.userGradidoID = user.gradidoID
          transaction.userName = fullName(user.firstName, user.lastName)
          transaction.previous = lastTransaction ? lastTransaction.id : null
          transaction.amount = contribution.amount
          transaction.creationDate = contribution.contributionDate
          transaction.balance = newBalance
          transaction.balanceDate = now
          transaction.decay = decay ? decay.decay : new Decimal(0)
          transaction.decayStart = decay ? decay.start : null
          await queryRunner.manager.insert(DbTransaction, transaction)

          contribution.confirmedAt = now
          contribution.transactionId = transaction.id
          await queryRunner.manager.update(DbContribution, { id: contribution.id }, contribution)

          await queryRunner.commitTransaction()
          await EVENT_CONTRIBUTION_LINK_REDEEM(
            user,
            transaction,
            contribution,
            contributionLink,
            contributionLink.amount,
          )
        } catch (e) {
          await queryRunner.rollbackTransaction()
          throw new LogError('Creation from contribution link was not successful', e)
        } finally {
          await queryRunner.release()
        }
      } finally {
        releaseLock()
      }
      return true
    } else {
      const now = new Date()
      const transactionLink = await DbTransactionLink.findOne({ code })
      if (!transactionLink) {
        throw new LogError('Transaction link not found', code)
      }

      const linkedUser = await DbUser.findOne(
        { id: transactionLink.userId },
        { relations: ['emailContact'] },
      )

      if (!linkedUser) {
        throw new LogError('Linked user not found for given link', transactionLink.userId)
      }

      if (user.id === linkedUser.id) {
        throw new LogError('Cannot redeem own transaction link', user.id)
      }

      // TODO: The now check should be done within the semaphore lock,
      // since the program might wait a while till it is ready to proceed
      // writing the transaction.
      if (transactionLink.validUntil.getTime() < now.getTime()) {
        throw new LogError('Transaction link is not valid anymore', transactionLink.validUntil)
      }

      if (transactionLink.redeemedBy) {
        throw new LogError('Transaction link already redeemed', transactionLink.redeemedBy)
      }

      await executeTransaction(
        transactionLink.amount,
        transactionLink.memo,
        linkedUser,
        user,
        transactionLink,
      )
      await EVENT_TRANSACTION_LINK_REDEEM(
        user,
        { id: transactionLink.userId } as DbUser,
        transactionLink,
        transactionLink.amount,
      )

      return true
    }
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS])
  @Query(() => TransactionLinkResult)
  async listTransactionLinks(
    @Args()
    paginated: Paginated,
    @Ctx() context: Context,
  ): Promise<TransactionLinkResult> {
    return transactionLinkList(
      paginated,
      {
        withDeleted: false,
        withExpired: true,
        withRedeemed: false,
      },
      getUser(context),
    )
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS_ADMIN])
  @Query(() => TransactionLinkResult)
  async listTransactionLinksAdmin(
    @Args()
    paginated: Paginated,
    // eslint-disable-next-line type-graphql/wrong-decorator-signature
    @Arg('filters', () => TransactionLinkFilters, { nullable: true })
    filters: TransactionLinkFilters | null, // eslint-disable-line type-graphql/invalid-nullable-input-type
    @Arg('userId', () => Int)
    userId: number,
  ): Promise<TransactionLinkResult> {
    const user = await DbUser.findOne({ id: userId })
    if (!user) {
      throw new LogError('Could not find requested User', userId)
    }
    return transactionLinkList(paginated, filters, user)
  }
}
