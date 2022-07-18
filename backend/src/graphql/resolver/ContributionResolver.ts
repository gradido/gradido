import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
<<<<<<< HEAD
import { Contribution } from '@entity/Contribution'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Resolver } from 'type-graphql'
import ContributionArgs from '../arg/ContributionArgs'
import { UnconfirmedContribution } from '../model/UnconfirmedContribution'
import { validateContribution, getUserCreation } from './util/creations'
=======
import { Contribution as dbContribution } from '@entity/Contribution'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { FindOperator, IsNull } from '@dbTools/typeorm'
import ContributionArgs from '@arg/ContributionArgs'
import Paginated from '@arg/Paginated'
import { Order } from '@enum/Order'
import { Contribution, ContributionListResult } from '@model/Contribution'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import { User } from '@model/User'
import { validateContribution, getUserCreation, updateCreations } from './util/creations'
>>>>>>> master

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

<<<<<<< HEAD
  @Authorized([RIGHTS.DELETE_CONTRIBUTION])
  @Mutation(() => Boolean)
  async adminDeleteContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    const contribution = await Contribution.findOne(id)
    if (!contribution) {
      throw new Error('Contribution not found for given id.')
    }
    if (contribution.userId !== user.id) {
      throw new Error('Can not delete contribution of another user')
    }
    const res = await contribution.softRemove()
    return !!res
=======
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
      withDeleted: true,
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
    const [dbContributions, count] = await dbContribution.findAndCount({
      relations: ['user'],
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })
    return new ContributionListResult(
      count,
      dbContributions.map(
        (contribution) => new Contribution(contribution, new User(contribution.user)),
      ),
    )
  }

  @Authorized([RIGHTS.UPDATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async updateContribution(
    @Arg('contributionId', () => Int)
    contributionId: number,
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const user = getUser(context)

    const contributionToUpdate = await dbContribution.findOne({
      where: { id: contributionId, confirmedAt: IsNull() },
    })
    if (!contributionToUpdate) {
      throw new Error('No contribution found to given id.')
    }
    if (contributionToUpdate.userId !== user.id) {
      throw new Error('user of the pending contribution and send user does not correspond')
    }

    const creationDateObj = new Date(creationDate)
    let creations = await getUserCreation(user.id)
    if (contributionToUpdate.contributionDate.getMonth() === creationDateObj.getMonth()) {
      creations = updateCreations(creations, contributionToUpdate)
    }

    // all possible cases not to be true are thrown in this function
    validateContribution(creations, amount, creationDateObj)
    contributionToUpdate.amount = amount
    contributionToUpdate.memo = memo
    contributionToUpdate.contributionDate = new Date(creationDate)
    dbContribution.save(contributionToUpdate)

    return new UnconfirmedContribution(contributionToUpdate, user, creations)
>>>>>>> master
  }
}
