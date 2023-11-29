/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { EntityManager, FindOptionsRelations, getConnection } from '@dbTools/typeorm'
import { Contribution, Contribution as DbContribution } from '@entity/Contribution'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import { User as DbUser } from '@entity/User'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'

import { ContributionMessageArgs } from '@arg/ContributionMessageArgs'
import { Paginated } from '@arg/Paginated'
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { Order } from '@enum/Order'
import { ContributionMessage, ContributionMessageListResult } from '@model/ContributionMessage'

import { RIGHTS } from '@/auth/RIGHTS'
import { sendAddedContributionMessageEmail } from '@/emails/sendEmailVariants'
import {
  EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE,
  EVENT_CONTRIBUTION_MESSAGE_CREATE,
} from '@/event/Events'
import { UpdateUnconfirmedContributionContext } from '@/interactions/updateUnconfirmedContribution/UpdateUnconfirmedContribution.context'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

import { findContributionMessages } from './util/findContributionMessages'

@Resolver()
export class ContributionMessageResolver {
  @Authorized([RIGHTS.CREATE_CONTRIBUTION_MESSAGE])
  @Mutation(() => ContributionMessage)
  async createContributionMessage(
    @Args() contributionMessageArgs: ContributionMessageArgs,
    @Ctx() context: Context,
  ): Promise<ContributionMessage> {
    const { contributionId } = contributionMessageArgs
    const updateUnconfirmedContributionContext = new UpdateUnconfirmedContributionContext(
      contributionId,
      contributionMessageArgs,
      context,
    )
    let finalContribution: DbContribution | undefined
    let finalContributionMessage: DbContributionMessage | undefined

    try {
      await getConnection().transaction(
        'REPEATABLE READ',
        async (transactionalEntityManager: EntityManager) => {
          const { contribution, contributionMessage, contributionChanged } =
            await updateUnconfirmedContributionContext.run(transactionalEntityManager)

          if (contributionChanged) {
            await transactionalEntityManager.update(
              Contribution,
              { id: contributionId },
              contribution,
            )
          }
          if (contributionMessage) {
            await transactionalEntityManager.insert(ContributionMessage, contributionMessage)
          }

          finalContribution = contribution
          finalContributionMessage = contributionMessage
        },
      )
    } catch (e) {
      throw new LogError(`ContributionMessage was not sent successfully: ${e}`, e)
    }
    if (!finalContribution || !finalContributionMessage) {
      throw new LogError('ContributionMessage was not sent successfully')
    }
    const user = getUser(context)

    await EVENT_CONTRIBUTION_MESSAGE_CREATE(
      user,
      { id: contributionId } as DbContribution,
      finalContributionMessage,
    )
    return new ContributionMessage(finalContributionMessage, user)
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
    @Args() contributionMessageArgs: ContributionMessageArgs,
    @Ctx() context: Context,
  ): Promise<ContributionMessage> {
    const { contributionId, messageType } = contributionMessageArgs
    const updateUnconfirmedContributionContext = new UpdateUnconfirmedContributionContext(
      contributionId,
      contributionMessageArgs,
      context,
    )
    const relations: FindOptionsRelations<DbContribution> =
      messageType === ContributionMessageType.DIALOG
        ? { user: { emailContact: true } }
        : { user: true }
    let finalContribution: DbContribution | undefined
    let finalContributionMessage: DbContributionMessage | undefined

    try {
      await getConnection().transaction(
        'REPEATABLE READ',
        async (transactionalEntityManager: EntityManager) => {
          const { contribution, contributionMessage, contributionChanged } =
            await updateUnconfirmedContributionContext.run(transactionalEntityManager, relations)

          if (contributionChanged) {
            await transactionalEntityManager.update(
              Contribution,
              { id: contributionId },
              contribution,
            )
          }
          if (contributionMessage) {
            await transactionalEntityManager.insert(DbContributionMessage, contributionMessage)
          }
          finalContribution = contribution
          finalContributionMessage = contributionMessage
        },
      )
    } catch (e) {
      throw new LogError(`ContributionMessage was not sent successfully: ${e}`, e)
    }
    if (!finalContribution || !finalContributionMessage) {
      throw new LogError('ContributionMessage was not sent successfully')
    }
    const moderator = getUser(context)
    if (messageType === ContributionMessageType.DIALOG) {
      // send email (never for moderator messages)
      void sendAddedContributionMessageEmail({
        firstName: finalContribution.user.firstName,
        lastName: finalContribution.user.lastName,
        email: finalContribution.user.emailContact.email,
        language: finalContribution.user.language,
        senderFirstName: moderator.firstName,
        senderLastName: moderator.lastName,
        contributionMemo: finalContribution.memo,
      })
    }

    await EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE(
      { id: finalContribution.userId } as DbUser,
      moderator,
      finalContribution,
      finalContributionMessage,
    )
    return new ContributionMessage(finalContributionMessage, moderator)
  }
}
