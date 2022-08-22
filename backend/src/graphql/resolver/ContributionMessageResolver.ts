import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { ContributionMessage } from '@entity/ContributionMessage'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import ContributionMessageArgs from '@arg/ContributionMessageArgs'
import { Contribution } from '@entity/Contribution'
import { ContributionMessageType } from '@enum/MessageType'
import { ContributionStatus } from '../enum/ContributionStatus'

@Resolver()
export class ContributionResolver {
  @Authorized([RIGHTS.CREATE_CONTRIBUTION_MESSAGE])
  @Mutation(() => ContributionMessage)
  async createContributionMessage(
    @Args() { contributionId, message }: ContributionMessageArgs,
    @Ctx() context: Context,
  ): Promise<ContributionMessage> {
    const user = getUser(context)
    const contribution = await Contribution.findOneOrFail({ id: contributionId })
    if (!user.isAdmin && contribution.userId !== user.id) {
      throw new Error('Can not send message to contribution of another user')
    }

    const contributionMessage = new ContributionMessage()
    contributionMessage.contributionId = contributionId
    contributionMessage.createdAt = new Date()
    contributionMessage.message = message
    contributionMessage.userId = user.id
    contributionMessage.type = ContributionMessageType.DIALOG
    ContributionMessage.save(contributionMessage)

    if (user.isAdmin && contribution.contributionStatus === ContributionStatus.PENDING) {
      contribution.contributionStatus = ContributionStatus.IN_PROGRESS
    } else if (
      !user.isAdmin &&
      contribution.contributionStatus === ContributionStatus.IN_PROGRESS
    ) {
      contribution.contributionStatus = ContributionStatus.PENDING
    }
    Contribution.save(contribution)

    return contributionMessage
  }
}
