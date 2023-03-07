import Decimal from 'decimal.js-light'
import { Resolver, Args, Arg, Authorized, Mutation, Query, Int, Ctx } from 'type-graphql'
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
import LogError from '@/server/LogError'
import { Context, getUser } from '@/server/context'
import {
  EVENT_ADMIN_CONTRIBUTION_LINK_CREATE,
  EVENT_ADMIN_CONTRIBUTION_LINK_DELETE,
  EVENT_ADMIN_CONTRIBUTION_LINK_UPDATE,
} from '@/event/Event'

@Resolver()
export class ContributionLinkResolver {
  @Authorized([RIGHTS.ADMIN_CREATE_CONTRIBUTION_LINK])
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
    @Ctx() context: Context,
  ): Promise<ContributionLink> {
    isStartEndDateValid(validFrom, validTo)
    if (name.length < CONTRIBUTIONLINK_NAME_MIN_CHARS) {
      throw new LogError('The value of name is too short', name.length)
    }
    if (name.length > CONTRIBUTIONLINK_NAME_MAX_CHARS) {
      throw new LogError('The value of name is too long', name.length)
    }
    if (memo.length < MEMO_MIN_CHARS) {
      throw new LogError('The value of memo is too short', memo.length)
    }
    if (memo.length > MEMO_MAX_CHARS) {
      throw new LogError('The value of memo is too long', memo.length)
    }
    if (!new Decimal(amount).isPositive()) {
      throw new LogError('The amount must be a positiv value', amount)
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
    await EVENT_ADMIN_CONTRIBUTION_LINK_CREATE(getUser(context), dbContributionLink, amount)

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

  @Authorized([RIGHTS.ADMIN_DELETE_CONTRIBUTION_LINK])
  @Mutation(() => Boolean, { nullable: true })
  async deleteContributionLink(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const dbContributionLink = await DbContributionLink.findOne(id)
    if (!dbContributionLink) {
      throw new LogError('Contribution Link not found', id)
    }
    await dbContributionLink.softRemove()
    await EVENT_ADMIN_CONTRIBUTION_LINK_DELETE(getUser(context), dbContributionLink)

    return true
  }

  @Authorized([RIGHTS.ADMIN_UPDATE_CONTRIBUTION_LINK])
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
    @Ctx() context: Context,
  ): Promise<ContributionLink> {
    const dbContributionLink = await DbContributionLink.findOne(id)
    if (!dbContributionLink) {
      throw new LogError('Contribution Link not found', id)
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

    await EVENT_ADMIN_CONTRIBUTION_LINK_UPDATE(getUser(context), dbContributionLink, amount)

    return new ContributionLink(dbContributionLink)
  }
}
