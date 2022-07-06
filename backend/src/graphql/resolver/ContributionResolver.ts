import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { Contribution } from '@entity/Contribution'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
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
}
