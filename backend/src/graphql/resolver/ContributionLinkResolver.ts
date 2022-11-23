import Decimal from 'decimal.js-light'
import { Resolver, Args, Arg, Authorized, Mutation, Query, Int } from 'type-graphql'
import { MoreThan, IsNull } from '@dbTools/typeorm'

import {
  CONTRIBUTIONLINK_NAME_MAX_CHARS,
  CONTRIBUTIONLINK_NAME_MIN_CHARS,
  MEMO_MAX_CHARS,
  MEMO_MIN_CHARS,
} from './const/const'
import { isStartEndDateValid } from './util/creations'
import { ContributionLinkList } from '@model/ContributionLinkList'
import { ContributionLink } from '@model/ContributionLink'
import ContributionLinkArgs from '@arg/ContributionLinkArgs'
import { backendLogger as logger } from '@/server/logger'
import { RIGHTS } from '@/auth/RIGHTS'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { Order } from '@enum/Order'
import Paginated from '@arg/Paginated'

// TODO: this is a strange construct
import { transactionLinkCode as contributionLinkCode } from './TransactionLinkResolver'

@Resolver()
export class ContributionLinkResolver {
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
