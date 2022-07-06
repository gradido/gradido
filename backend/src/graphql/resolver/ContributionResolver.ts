import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { Contribution } from '@entity/Contribution'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Resolver } from 'type-graphql'
import ContributionArgs from '../arg/ContributionArgs'
import { UnconfirmedContribution } from '../model/UnconfirmedContribution'
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

    const contribution = Contribution.create()
    contribution.userId = user.id
    contribution.amount = amount
    contribution.createdAt = new Date()
    contribution.contributionDate = creationDateObj
    contribution.memo = memo

    logger.trace('contribution to save', contribution)
    await Contribution.save(contribution)
    return new UnconfirmedContribution(contribution, user, creations)
  }

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
  }
}
