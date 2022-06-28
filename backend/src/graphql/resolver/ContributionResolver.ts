import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { Contribution } from '@entity/Contribution'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import CreateContributionArgs from '../arg/CreateContributionArgs'
import { getUserCreation } from './util/getUserCreation'
import { isContributionValid } from './util/isContributionValid'

@Resolver()
export class ContributionResolver {
  @Authorized([RIGHTS.CREATE_CONTRIBUTION])
  @Mutation(() => Boolean)
  async createContribution(
    @Args() { amount, memo, creationDate }: CreateContributionArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    const creations = await getUserCreation(user.id)
    logger.trace('creations', creations)
    const creationDateObj = new Date(creationDate)
    isContributionValid(creations, amount, creationDateObj)

    const contribution = Contribution.create()
    contribution.userId = user.id
    contribution.amount = amount
    contribution.createdAt = new Date()
    contribution.contributionDate = creationDateObj
    contribution.memo = memo

    logger.trace('contribution to save', contribution)
    await Contribution.save(contribution)
    return true
  }
}
