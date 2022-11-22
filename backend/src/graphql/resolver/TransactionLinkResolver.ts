import { randomBytes } from 'crypto'
import Decimal from 'decimal.js-light'

import { getConnection, MoreThan, FindOperator, IsNull } from '@dbTools/typeorm'

import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'

import { User } from '@model/User'
import { ContributionLink } from '@model/ContributionLink'
import { Decay } from '@model/Decay'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'
import { ContributionLinkList } from '@model/ContributionLinkList'
import { Order } from '@enum/Order'
import { ContributionType } from '@enum/ContributionType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { ContributionCycleType } from '@enum/ContributionCycleType'
import TransactionLinkArgs from '@arg/TransactionLinkArgs'
import Paginated from '@arg/Paginated'
import TransactionLinkFilters from '@arg/TransactionLinkFilters'
import ContributionLinkArgs from '@arg/ContributionLinkArgs'

import { backendLogger as logger } from '@/server/logger'
import { Context, getUser, getClientTimezoneOffset } from '@/server/context'
import {
  Resolver,
  Args,
  Arg,
  Authorized,
  Ctx,
  Mutation,
  Query,
  Int,
  createUnionType,
} from 'type-graphql'
import { calculateBalance } from '@/util/validate'
import { RIGHTS } from '@/auth/RIGHTS'
import { calculateDecay } from '@/util/decay'
import { getUserCreation, validateContribution, isStartEndDateValid } from './util/creations'
import {
  CONTRIBUTIONLINK_NAME_MAX_CHARS,
  CONTRIBUTIONLINK_NAME_MIN_CHARS,
  MEMO_MAX_CHARS,
  MEMO_MIN_CHARS,
} from './const/const'
import { executeTransaction } from './TransactionResolver'
import { transactionLinkCode as contributionLinkCode } from './TransactionLinkResolver'

const QueryLinkResult = createUnionType({
  name: 'QueryLinkResult', // the name of the GraphQL union
  types: () => [TransactionLink, ContributionLink] as const, // function that returns tuple of object types classes
})

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

    const holdAvailableAmount = amount.minus(calculateDecay(amount, createdDate, validUntil).decay)

    // validate amount
    await calculateBalance(user.id, holdAvailableAmount, createdDate)

    const transactionLink = DbTransactionLink.create()
    transactionLink.userId = user.id
    transactionLink.amount = amount
    transactionLink.memo = memo
    transactionLink.holdAvailableAmount = holdAvailableAmount
    transactionLink.code = transactionLinkCode(createdDate)
    transactionLink.createdAt = createdDate
    transactionLink.validUntil = validUntil
    await DbTransactionLink.save(transactionLink).catch(() => {
      throw new Error('Unable to save transaction link')
    })

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
      if (transactionLink && transactionLink.redeemedBy) {
        redeemedBy = new User(await DbUser.findOneOrFail({ id: transactionLink.redeemedBy }))
      }
      return new TransactionLink(transactionLink, new User(user), redeemedBy)
    }
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS])
  @Query(() => [TransactionLink])
  async listTransactionLinks(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Ctx() context: Context,
  ): Promise<TransactionLink[]> {
    const user = getUser(context)
    // const now = new Date()
    const transactionLinks = await DbTransactionLink.find({
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
  async redeemTransactionLink(
    @Arg('code', () => String) code: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const user = getUser(context)
    const now = new Date()

    if (code.match(/^CL-/)) {
      logger.info('redeem contribution link...')
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
          logger.error('no contribution link found to given code:', code)
          throw new Error('No contribution link found')
        }
        logger.info('...contribution link found with id', contributionLink.id)
        if (new Date(contributionLink.validFrom).getTime() > now.getTime()) {
          logger.error(
            'contribution link is not valid yet. Valid from: ',
            contributionLink.validFrom,
          )
          throw new Error('Contribution link not valid yet')
        }
        if (contributionLink.validTo) {
          if (new Date(contributionLink.validTo).setHours(23, 59, 59) < now.getTime()) {
            logger.error('contribution link is depricated. Valid to: ', contributionLink.validTo)
            throw new Error('Contribution link is depricated')
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
              logger.error(
                'contribution link with rule ONCE already redeemed by user with id',
                user.id,
              )
              throw new Error('Contribution link already redeemed')
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
              logger.error(
                'contribution link with rule DAILY already redeemed by user with id',
                user.id,
              )
              throw new Error('Contribution link already redeemed today')
            }
            break
          }
          default: {
            logger.error('contribution link has unknown cycle', contributionLink.cycle)
            throw new Error('Contribution link has unknown cycle')
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

        const lastTransaction = await queryRunner.manager
          .createQueryBuilder()
          .select('transaction')
          .from(DbTransaction, 'transaction')
          .where('transaction.userId = :id', { id: user.id })
          .orderBy('transaction.balanceDate', 'DESC')
          .getOne()
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
        logger.info('creation from contribution link commited successfuly.')
      } catch (e) {
        await queryRunner.rollbackTransaction()
        logger.error(`Creation from contribution link was not successful: ${e}`)
        throw new Error(`Creation from contribution link was not successful. ${e}`)
      } finally {
        await queryRunner.release()
      }
      return true
    } else {
      const transactionLink = await DbTransactionLink.findOneOrFail({ code })
      const linkedUser = await DbUser.findOneOrFail(
        { id: transactionLink.userId },
        { relations: ['emailContact'] },
      )

      if (user.id === linkedUser.id) {
        throw new Error('Cannot redeem own transaction link.')
      }

      if (transactionLink.validUntil.getTime() < now.getTime()) {
        throw new Error('Transaction Link is not valid anymore.')
      }

      if (transactionLink.redeemedBy) {
        throw new Error('Transaction Link already redeemed.')
      }

      await executeTransaction(
        transactionLink.amount,
        transactionLink.memo,
        linkedUser,
        user,
        transactionLink,
      )

      return true
    }
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS_ADMIN])
  @Query(() => TransactionLinkResult)
  async listTransactionLinksAdmin(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Arg('filters', () => TransactionLinkFilters, { nullable: true })
    filters: TransactionLinkFilters,
    @Arg('userId', () => Int)
    userId: number,
  ): Promise<TransactionLinkResult> {
    const user = await DbUser.findOneOrFail({ id: userId })
    const where: {
      userId: number
      redeemedBy?: number | null
      validUntil?: FindOperator<Date> | null
    } = {
      userId,
      redeemedBy: null,
      validUntil: MoreThan(new Date()),
    }
    if (filters) {
      if (filters.withRedeemed) delete where.redeemedBy
      if (filters.withExpired) delete where.validUntil
    }
    const [transactionLinks, count] = await DbTransactionLink.findAndCount({
      where,
      withDeleted: filters ? filters.withDeleted : false,
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })

    return {
      linkCount: count,
      linkList: transactionLinks.map((tl) => new TransactionLink(tl, new User(user))),
    }
  }

  @Authorized([RIGHTS.CREATE_CONTRIBUTION_LINK])
  @Mutation(() => ContributionLink)
  async createContributionLink(
    @Args()
    {
      amount,
      name,
      memo,
      cycle,
      validFrom,
      validTo,
      maxAmountPerMonth,
      maxPerCycle,
    }: ContributionLinkArgs,
  ): Promise<ContributionLink> {
    isStartEndDateValid(validFrom, validTo)
    if (!name) {
      logger.error(`The name must be initialized!`)
      throw new Error(`The name must be initialized!`)
    }
    if (
      name.length < CONTRIBUTIONLINK_NAME_MIN_CHARS ||
      name.length > CONTRIBUTIONLINK_NAME_MAX_CHARS
    ) {
      const msg = `The value of 'name' with a length of ${name.length} did not fulfill the requested bounderies min=${CONTRIBUTIONLINK_NAME_MIN_CHARS} and max=${CONTRIBUTIONLINK_NAME_MAX_CHARS}`
      logger.error(`${msg}`)
      throw new Error(`${msg}`)
    }
    if (!memo) {
      logger.error(`The memo must be initialized!`)
      throw new Error(`The memo must be initialized!`)
    }
    if (memo.length < MEMO_MIN_CHARS || memo.length > MEMO_MAX_CHARS) {
      const msg = `The value of 'memo' with a length of ${memo.length} did not fulfill the requested bounderies min=${MEMO_MIN_CHARS} and max=${MEMO_MAX_CHARS}`
      logger.error(`${msg}`)
      throw new Error(`${msg}`)
    }
    if (!amount) {
      logger.error(`The amount must be initialized!`)
      throw new Error('The amount must be initialized!')
    }
    if (!new Decimal(amount).isPositive()) {
      logger.error(`The amount=${amount} must be initialized with a positiv value!`)
      throw new Error(`The amount=${amount} must be initialized with a positiv value!`)
    }
    const dbContributionLink = new DbContributionLink()
    dbContributionLink.amount = amount
    dbContributionLink.name = name
    dbContributionLink.memo = memo
    dbContributionLink.createdAt = new Date()
    dbContributionLink.code = contributionLinkCode(dbContributionLink.createdAt)
    dbContributionLink.cycle = cycle
    if (validFrom) dbContributionLink.validFrom = new Date(validFrom)
    if (validTo) dbContributionLink.validTo = new Date(validTo)
    dbContributionLink.maxAmountPerMonth = maxAmountPerMonth
    dbContributionLink.maxPerCycle = maxPerCycle
    await dbContributionLink.save()
    logger.debug(`createContributionLink successful!`)
    return new ContributionLink(dbContributionLink)
  }

  @Authorized([RIGHTS.LIST_CONTRIBUTION_LINKS])
  @Query(() => ContributionLinkList)
  async listContributionLinks(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  ): Promise<ContributionLinkList> {
    const [links, count] = await DbContributionLink.findAndCount({
      where: [{ validTo: MoreThan(new Date()) }, { validTo: IsNull() }],
      order: { createdAt: order },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })
    return {
      links: links.map((link: DbContributionLink) => new ContributionLink(link)),
      count,
    }
  }

  @Authorized([RIGHTS.DELETE_CONTRIBUTION_LINK])
  @Mutation(() => Date, { nullable: true })
  async deleteContributionLink(@Arg('id', () => Int) id: number): Promise<Date | null> {
    const contributionLink = await DbContributionLink.findOne(id)
    if (!contributionLink) {
      logger.error(`Contribution Link not found to given id: ${id}`)
      throw new Error('Contribution Link not found to given id.')
    }
    await contributionLink.softRemove()
    logger.debug(`deleteContributionLink successful!`)
    const newContributionLink = await DbContributionLink.findOne({ id }, { withDeleted: true })
    return newContributionLink ? newContributionLink.deletedAt : null
  }

  @Authorized([RIGHTS.UPDATE_CONTRIBUTION_LINK])
  @Mutation(() => ContributionLink)
  async updateContributionLink(
    @Args()
    {
      amount,
      name,
      memo,
      cycle,
      validFrom,
      validTo,
      maxAmountPerMonth,
      maxPerCycle,
    }: ContributionLinkArgs,
    @Arg('id', () => Int) id: number,
  ): Promise<ContributionLink> {
    const dbContributionLink = await DbContributionLink.findOne(id)
    if (!dbContributionLink) {
      logger.error(`Contribution Link not found to given id: ${id}`)
      throw new Error('Contribution Link not found to given id.')
    }
    dbContributionLink.amount = amount
    dbContributionLink.name = name
    dbContributionLink.memo = memo
    dbContributionLink.cycle = cycle
    if (validFrom) dbContributionLink.validFrom = new Date(validFrom)
    if (validTo) dbContributionLink.validTo = new Date(validTo)
    dbContributionLink.maxAmountPerMonth = maxAmountPerMonth
    dbContributionLink.maxPerCycle = maxPerCycle
    await dbContributionLink.save()
    logger.debug(`updateContributionLink successful!`)
    return new ContributionLink(dbContributionLink)
  }
}
