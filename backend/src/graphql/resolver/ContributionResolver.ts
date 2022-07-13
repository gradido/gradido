import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { Contribution as dbContribution } from '@entity/Contribution'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
<<<<<<< HEAD
import { FindOperator, IsNull } from '@dbTools/typeorm'
import ContributionArgs from '@arg/ContributionArgs'
import Paginated from '@arg/Paginated'
import { Order } from '@enum/Order'
import { Contribution } from '@model/Contribution'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import { User } from '@model/User'
=======
import { IsNull, Not } from '../../../../database/node_modules/typeorm'
import ContributionArgs from '../arg/ContributionArgs'
import Paginated from '../arg/Paginated'
import { Order } from '../enum/Order'
import { Contribution } from '../model/Contribution'
import { UnconfirmedContribution } from '../model/UnconfirmedContribution'
import { User } from '../model/User'
>>>>>>> 193c7927e (resolve conflict)
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
}
