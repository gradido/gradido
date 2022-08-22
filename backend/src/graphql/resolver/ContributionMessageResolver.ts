import { backendLogger as logger } from '@/server/logger'
import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { ContributionMessage } from '@entity/ContributionMessage'
import { Args, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import ContributionMessageArgs from '@arg/ContributionMessageArgs'
import { Contribution } from '@entity/Contribution'
import { ContributionMessageType } from '@enum/MessageType'
import { ContributionStatus } from '../enum/ContributionStatus'
import { getConnection } from '@dbTools/typeorm'

@Resolver()
export class ContributionResolver {
  // TODO: Have two method one for admin on for
  @Authorized([RIGHTS.CREATE_CONTRIBUTION_MESSAGE])
  @Mutation(() => ContributionMessage)
  async createContributionMessage(
    @Args() { contributionId, message }: ContributionMessageArgs,
    @Ctx() context: Context,
  ): Promise<ContributionMessage> {
    const user = getUser(context)
    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')
    const contributionMessage = new ContributionMessage()
    try {
      const contribution = await Contribution.findOneOrFail({ id: contributionId })
      if (contribution.userId !== user.id) {
        throw new Error('Can not send message to contribution of another user')
      }

      contributionMessage.contributionId = contributionId
      contributionMessage.createdAt = new Date()
      contributionMessage.message = message
      contributionMessage.userId = user.id
      contributionMessage.type = ContributionMessageType.DIALOG
      await queryRunner.manager.insert(ContributionMessage, contributionMessage)

      if (contribution.contributionStatus === ContributionStatus.IN_PROGRESS) {
        contribution.contributionStatus = ContributionStatus.PENDING
        await queryRunner.manager.update(Contribution, { id: contributionId }, contribution)
      }
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error(`ContributionMessage was not successful: ${e}`)
      throw new Error(`Transaction was not successful: ${e}`)
    } finally {
      await queryRunner.release()
    }
    return contributionMessage
  }
}
