import { ContributionLinkArgs } from '@arg/ContributionLinkArgs'
import { Paginated } from '@arg/Paginated'
import { Order } from '@enum/Order'
import { ContributionLink } from '@model/ContributionLink'
import { ContributionLinkList } from '@model/ContributionLinkList'
import { ContributionLink as DbContributionLink } from 'database'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { IsNull, MoreThan } from 'typeorm'

import { RIGHTS } from '@/auth/RIGHTS'
import {
  EVENT_ADMIN_CONTRIBUTION_LINK_CREATE,
  EVENT_ADMIN_CONTRIBUTION_LINK_DELETE,
  EVENT_ADMIN_CONTRIBUTION_LINK_UPDATE,
} from '@/event/Events'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

import { transactionLinkCode as contributionLinkCode } from './TransactionLinkResolver'
import { isStartEndDateValid } from './util/creations'

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
      maxAmountPerMonth = null,
      maxPerCycle,
    }: ContributionLinkArgs,
    @Ctx() context: Context,
  ): Promise<ContributionLink> {
    isStartEndDateValid(validFrom, validTo)

    const dbContributionLink = new DbContributionLink()
    dbContributionLink.amount = amount
    dbContributionLink.name = name
    dbContributionLink.memo = memo
    dbContributionLink.createdAt = new Date()
    dbContributionLink.code = contributionLinkCode(dbContributionLink.createdAt)
    dbContributionLink.cycle = cycle
    if (validFrom) {
      dbContributionLink.validFrom = new Date(validFrom)
    }
    if (validTo) {
      dbContributionLink.validTo = new Date(validTo)
    }
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

  @Authorized([RIGHTS.DELETE_CONTRIBUTION_LINK])
  @Mutation(() => Boolean)
  async deleteContributionLink(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const dbContributionLink = await DbContributionLink.findOne({ where: { id } })
    if (!dbContributionLink) {
      throw new LogError('Contribution Link not found', id)
    }
    await dbContributionLink.softRemove()
    await EVENT_ADMIN_CONTRIBUTION_LINK_DELETE(getUser(context), dbContributionLink)

    return true
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
      maxAmountPerMonth = null,
      maxPerCycle,
    }: ContributionLinkArgs,
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<ContributionLink> {
    const dbContributionLink = await DbContributionLink.findOne({ where: { id } })
    if (!dbContributionLink) {
      throw new LogError('Contribution Link not found', id)
    }
    dbContributionLink.amount = amount
    dbContributionLink.name = name
    dbContributionLink.memo = memo
    dbContributionLink.cycle = cycle
    if (validFrom) {
      dbContributionLink.validFrom = new Date(validFrom)
    }
    if (validTo) {
      dbContributionLink.validTo = new Date(validTo)
    }
    dbContributionLink.maxAmountPerMonth = maxAmountPerMonth
    dbContributionLink.maxPerCycle = maxPerCycle
    await dbContributionLink.save()
    await EVENT_ADMIN_CONTRIBUTION_LINK_UPDATE(getUser(context), dbContributionLink, amount)

    return new ContributionLink(dbContributionLink)
  }
}
