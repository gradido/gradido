import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { getConnection } from '@dbTools/typeorm'

import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { Contribution as DbContribution } from '@entity/Contribution'
import { UserContact } from '@entity/UserContact'

import { ContributionMessage, ContributionMessageListResult } from '@model/ContributionMessage'
import ContributionMessageArgs from '@arg/ContributionMessageArgs'
import { ContributionMessageType } from '@enum/MessageType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { Order } from '@enum/Order'
import Paginated from '@arg/Paginated'

import { backendLogger as logger } from '@/server/logger'
import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { sendAddedContributionMessageEmail } from '@/emails/sendEmailVariants'

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
    await queryRunner.startTransaction('REPEATABLE READ')
    const contributionMessage = DbContributionMessage.create()
    try {
      const contribution = await DbContribution.findOne({ id: contributionId })
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
      contributionMessage.isModerator = false
      await queryRunner.manager.insert(DbContributionMessage, contributionMessage)

      if (contribution.contributionStatus === ContributionStatus.IN_PROGRESS) {
        contribution.contributionStatus = ContributionStatus.PENDING
        await queryRunner.manager.update(DbContribution, { id: contributionId }, contribution)
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

  @Authorized([RIGHTS.ADMIN_CREATE_CONTRIBUTION_MESSAGE])
  @Mutation(() => ContributionMessage)
  async adminCreateContributionMessage(
    @Args() { contributionId, message }: ContributionMessageArgs,
    @Ctx() context: Context,
  ): Promise<ContributionMessage> {
    const user = getUser(context)
    if (!user.emailContact) {
      user.emailContact = await UserContact.findOneOrFail({ where: { id: user.emailId } })
    }
    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    const contributionMessage = DbContributionMessage.create()
    try {
      const contribution = await DbContribution.findOne({
        where: { id: contributionId },
        relations: ['user'],
      })
      if (!contribution) {
        logger.error('Contribution not found')
        throw new Error('Contribution not found')
      }
      if (contribution.userId === user.id) {
        logger.error('Admin can not answer on own contribution')
        throw new Error('Admin can not answer on own contribution')
      }
      if (!contribution.user.emailContact) {
        contribution.user.emailContact = await UserContact.findOneOrFail({
          where: { id: contribution.user.emailId },
        })
      }
      contributionMessage.contributionId = contributionId
      contributionMessage.createdAt = new Date()
      contributionMessage.message = message
      contributionMessage.userId = user.id
      contributionMessage.type = ContributionMessageType.DIALOG
      contributionMessage.isModerator = true
      await queryRunner.manager.insert(DbContributionMessage, contributionMessage)

      if (
        contribution.contributionStatus === ContributionStatus.DELETED ||
        contribution.contributionStatus === ContributionStatus.DENIED ||
        contribution.contributionStatus === ContributionStatus.PENDING
      ) {
        contribution.contributionStatus = ContributionStatus.IN_PROGRESS
        await queryRunner.manager.update(DbContribution, { id: contributionId }, contribution)
      }

      await sendAddedContributionMessageEmail({
        firstName: contribution.user.firstName,
        lastName: contribution.user.lastName,
        email: contribution.user.emailContact.email,
        language: contribution.user.language,
        senderFirstName: user.firstName,
        senderLastName: user.lastName,
        contributionMemo: contribution.memo,
      })
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
}
