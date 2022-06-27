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
    if (!user) {
      throw new Error(`Could not find user`)
    }
    if (user.deletedAt) {
      throw new Error('This user was deleted. Cannot create a contribution.')
    }
    if (!user.emailChecked) {
      throw new Error('Contribution could not be saved, Email is not activated')
    }
    const creations = await getUserCreation(user.id)
    logger.trace('creations', creations)
    const creationDateObj = new Date(creationDate)
    if (!isContributionValid(creations, amount, creationDateObj)) {
      throw new Error('Contribution is not valid')
    }
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
