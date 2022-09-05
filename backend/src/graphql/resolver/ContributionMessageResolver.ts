import { backendLogger as logger } from '@/server/logger'
import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import ContributionMessageArgs from '@arg/ContributionMessageArgs'
import { Contribution } from '@entity/Contribution'
import { ContributionMessageType } from '@enum/MessageType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { getConnection } from '@dbTools/typeorm'
import { ContributionMessage, ContributionMessageListResult } from '@model/ContributionMessage'
import Paginated from '@arg/Paginated'
import { Order } from '@enum/Order'

@Resolver()
export class ContributionMessageResolver {
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
    const contributionMessage = DbContributionMessage.create()
    try {
      const contribution = await Contribution.findOne({ id: contributionId })
      if (!contribution) {
        throw new Error('Contribution not found')
      }
      if (contribution.userId !== user.id) {
        throw new Error('Can not send message to contribution of another user')
      }

      contributionMessage.contributionId = contributionId
      contributionMessage.createdAt = new Date()
      contributionMessage.message = message
      contributionMessage.userId = user.id
      contributionMessage.type = ContributionMessageType.DIALOG
      await queryRunner.manager.insert(DbContributionMessage, contributionMessage)

      if (contribution.contributionStatus === ContributionStatus.IN_PROGRESS) {
        contribution.contributionStatus = ContributionStatus.PENDING
        await queryRunner.manager.update(Contribution, { id: contributionId }, contribution)
      }
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error(`ContributionMessage was not successful: ${e}`)
      throw new Error(`ContributionMessage was not successful: ${e}`)
    } finally {
      await queryRunner.release()
    }
    return new ContributionMessage(contributionMessage, user)
  }

  @Authorized([RIGHTS.LIST_ALL_CONTRIBUTION_MESSAGES])
  @Query(() => ContributionMessageListResult)
  async listContributionMessages(
    @Arg('contributionId') contributionId: number,
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  ): Promise<ContributionMessageListResult> {
    const [contributionMessages, count] = await getConnection()
      .createQueryBuilder()
      .select('cm')
      .from(DbContributionMessage, 'cm')
      .leftJoinAndSelect('cm.user', 'u')
      .where({ contributionId: contributionId })
      .orderBy('cm.createdAt', order)
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize)
      .getManyAndCount()

    return {
      count,
      messages: contributionMessages.map(
        (message) => new ContributionMessage(message, message.user),
      ),
    }
  }
}
