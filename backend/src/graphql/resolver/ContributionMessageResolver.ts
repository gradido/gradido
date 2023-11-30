/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { getConnection } from '@dbTools/typeorm'
import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'

import { ContributionMessageArgs } from '@arg/ContributionMessageArgs'
import { Paginated } from '@arg/Paginated'
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { Order } from '@enum/Order'
import { ContributionMessage, ContributionMessageListResult } from '@model/ContributionMessage'

import { RIGHTS } from '@/auth/RIGHTS'
import { sendAddedContributionMessageEmail } from '@/emails/sendEmailVariants'
import {
  EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE,
  EVENT_CONTRIBUTION_MESSAGE_CREATE,
} from '@/event/Events'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

import { findContributionMessages } from './util/findContributionMessages'

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
      const contribution = await DbContribution.findOne({ where: { id: contributionId } })
      if (!contribution) {
        throw new LogError('Contribution not found', contributionId)
      }
      if (contribution.userId !== user.id) {
        throw new LogError(
          'Can not send message to contribution of another user',
          contribution.userId,
          user.id,
        )
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
      await EVENT_CONTRIBUTION_MESSAGE_CREATE(
        user,
        { id: contributionMessage.contributionId } as DbContribution,
        contributionMessage,
      )
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError(`ContributionMessage was not sent successfully: ${e}`, e)
    } finally {
      await queryRunner.release()
    }
    return new ContributionMessage(contributionMessage, user)
  }

  @Authorized([RIGHTS.LIST_ALL_CONTRIBUTION_MESSAGES])
  @Query(() => ContributionMessageListResult)
  async listContributionMessages(
    @Arg('contributionId', () => Int) contributionId: number,
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  ): Promise<ContributionMessageListResult> {
    const [contributionMessages, count] = await findContributionMessages({
      contributionId,
      currentPage,
      pageSize,
      order,
    })

    return {
      count,
      messages: contributionMessages.map(
        (message) => new ContributionMessage(message, message.user),
      ),
    }
  }

  @Authorized([RIGHTS.ADMIN_LIST_ALL_CONTRIBUTION_MESSAGES])
  @Query(() => ContributionMessageListResult)
  async adminListContributionMessages(
    @Arg('contributionId', () => Int) contributionId: number,
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  ): Promise<ContributionMessageListResult> {
    const [contributionMessages, count] = await findContributionMessages({
      contributionId,
      currentPage,
      pageSize,
      order,
      showModeratorType: true,
    })

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
    @Args() { contributionId, message, messageType, resubmissionAt }: ContributionMessageArgs,
    @Ctx() context: Context,
  ): Promise<ContributionMessage> {
    const moderator = getUser(context)

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
        throw new LogError('Contribution not found', contributionId)
      }
      if (contribution.userId === moderator.id) {
        throw new LogError('Admin can not answer on his own contribution', contributionId)
      }
      if (!contribution.user.emailContact && contribution.user.emailId) {
        contribution.user.emailContact = await DbUserContact.findOneOrFail({
          where: { id: contribution.user.emailId },
        })
      }
      contributionMessage.contributionId = contributionId
      contributionMessage.createdAt = new Date()
      contributionMessage.message = message
      contributionMessage.userId = moderator.id
      contributionMessage.type = messageType
      contributionMessage.isModerator = true
      if (resubmissionAt) {
        contributionMessage.resubmissionAt = new Date(resubmissionAt)
      }
      await queryRunner.manager.insert(DbContributionMessage, contributionMessage)

      if (messageType !== ContributionMessageType.MODERATOR) {
        // change status (does not apply to moderator messages)
        if (
          contribution.contributionStatus === ContributionStatus.DELETED ||
          contribution.contributionStatus === ContributionStatus.DENIED ||
          contribution.contributionStatus === ContributionStatus.PENDING
        ) {
          contribution.contributionStatus = ContributionStatus.IN_PROGRESS
          await queryRunner.manager.update(DbContribution, { id: contributionId }, contribution)
        }

        // send email (never for moderator messages)
        void sendAddedContributionMessageEmail({
          firstName: contribution.user.firstName,
          lastName: contribution.user.lastName,
          email: contribution.user.emailContact.email,
          language: contribution.user.language,
          senderFirstName: moderator.firstName,
          senderLastName: moderator.lastName,
          contributionMemo: contribution.memo,
        })
      }
      await queryRunner.commitTransaction()
      await EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE(
        { id: contribution.userId } as DbUser,
        moderator,
        contribution,
        contributionMessage,
      )
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError(`ContributionMessage was not sent successfully: ${e}`, e)
    } finally {
      await queryRunner.release()
    }
    return new ContributionMessage(contributionMessage, moderator)
  }
}
