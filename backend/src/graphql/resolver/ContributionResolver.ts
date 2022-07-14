import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { Contribution as dbContribution } from '@entity/Contribution'
import { User as dbUser } from '@entity/User'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { FindOperator, IsNull, Not } from '@dbTools/typeorm'
import ContributionArgs from '@arg/ContributionArgs'
import Paginated from '@arg/Paginated'
import { Order } from '@enum/Order'
import { Contribution, ContributionListResult } from '@model/Contribution'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import { User } from '@model/User'
import { validateContribution, getUserCreation } from './util/creations'

@Resolver()
export class ContributionResolver {
  @Authorized([RIGHTS.CREATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async createContribution(
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const user = getUser(context)
    const creations = await getUserCreation(user.id)
    logger.trace('creations', creations)
    const creationDateObj = new Date(creationDate)
    validateContribution(creations, amount, creationDateObj)

    const contribution = dbContribution.create()
    contribution.userId = user.id
    contribution.amount = amount
    contribution.createdAt = new Date()
    contribution.contributionDate = creationDateObj
    contribution.memo = memo

    logger.trace('contribution to save', contribution)
    await dbContribution.save(contribution)
    return new UnconfirmedContribution(contribution, user, creations)
  }

  @Authorized([RIGHTS.LIST_CONTRIBUTIONS])
  @Query(() => [Contribution])
  async listContributions(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Arg('filterConfirmed', () => Boolean)
    filterConfirmed: boolean | null,
    @Ctx() context: Context,
  ): Promise<Contribution[]> {
    const user = getUser(context)
    const where: {
      userId: number
      confirmedBy?: FindOperator<number> | null
    } = { userId: user.id }
    if (filterConfirmed) where.confirmedBy = IsNull()
    const contributions = await dbContribution.find({
      where,
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })
    return contributions.map((contribution) => new Contribution(contribution, new User(user)))
  }

  @Authorized([RIGHTS.LIST_ALL_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async listAllContributions(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  ): Promise<ContributionListResult> {
    const dbContributions = await dbContribution.find({
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })
    const contributions: Contribution[] = []
    const userIds: number[] = []
    dbContributions.forEach(async (dbContribution) => {
      userIds.push(dbContribution.userId)
    })
    userIds.filter((elem, index, self) => {
      return index === self.indexOf(elem)
    })
    const users = new Map()
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i]
      const user = await dbUser.findOneOrFail({ id })
      users.set(id, user)
    }
    dbContributions.forEach((dbContribution) => {
      contributions.push(new Contribution(dbContribution, users.get(dbContribution.userId)))
    })
    return new ContributionListResult(contributions.length, contributions)
  }
}
