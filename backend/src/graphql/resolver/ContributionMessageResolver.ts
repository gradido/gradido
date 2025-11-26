import { ContributionMessageArgs } from '@arg/ContributionMessageArgs'
import { Paginated } from '@arg/Paginated'
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { Order } from '@enum/Order'
import { ContributionMessage, ContributionMessageListResult } from '@model/ContributionMessage'
import {
  AppDatabase,
  Contribution as DbContribution,
  ContributionMessage as DbContributionMessage,
  User as DbUser,
} from 'database'
import { getLogger } from 'log4js'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { EntityManager, FindOptionsRelations } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { sendAddedContributionMessageEmail } from '@/emails/sendEmailVariants'
import {
  EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE,
  EVENT_CONTRIBUTION_MESSAGE_CREATE,
} from '@/event/Events'
import { UpdateUnconfirmedContributionContext } from '@/interactions/updateUnconfirmedContribution/UpdateUnconfirmedContribution.context'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

import { contributionFrontendLink } from './util/contributions'
import { findContributionMessages } from './util/findContributionMessages'

const db = AppDatabase.getInstance()
const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ContributionMessageResolver`)

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
      await db
        .getDataSource()
        .transaction('REPEATABLE READ', async (transactionalEntityManager: EntityManager) => {
          const { contribution, contributionMessage, contributionChanged } =
            await updateUnconfirmedContributionContext.run(transactionalEntityManager)

          if (contributionChanged) {
            await transactionalEntityManager.update(
              DbContribution,
              { id: contributionId },
              contribution,
            )
          }
          if (contributionMessage) {
            await transactionalEntityManager.insert(DbContributionMessage, contributionMessage)
          }

          finalContribution = contribution
          finalContributionMessage = contributionMessage
        })
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
    return new ContributionMessage(finalContributionMessage)
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
      pagination: { currentPage, pageSize, order },
    })

    return {
      count,
      messages: contributionMessages.map((message) => new ContributionMessage(message)),
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
      pagination: { currentPage, pageSize, order },
      showModeratorType: true,
    })

    return {
      count,
      messages: contributionMessages.map((message) => new ContributionMessage(message)),
    }
  }

  @Authorized([RIGHTS.ADMIN_CREATE_CONTRIBUTION_MESSAGE])
  @Mutation(() => ContributionMessage)
  async adminCreateContributionMessage(
    @Args() contributionMessageArgs: ContributionMessageArgs,
    @Ctx() context: Context,
  ): Promise<ContributionMessage> {
    const logger = createLogger()
    const { contributionId, messageType } = contributionMessageArgs
    logger.addContext('contribution', contributionMessageArgs.contributionId)
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
      await db
        .getDataSource()
        .transaction('REPEATABLE READ', async (transactionalEntityManager: EntityManager) => {
          const { contribution, contributionMessage, contributionChanged } =
            await updateUnconfirmedContributionContext.run(transactionalEntityManager, relations)
          if (contributionChanged) {
            await transactionalEntityManager.update(
              DbContribution,
              { id: contributionId },
              contribution,
            )
            logger.debug(
              'contribution changed, resubmission at: %s, status: %s',
              contribution.resubmissionAt,
              contribution.contributionStatus,
            )
          }
          if (contributionMessage) {
            await transactionalEntityManager.insert(DbContributionMessage, contributionMessage)
          }
          finalContribution = contribution
          finalContributionMessage = contributionMessage
        })
    } catch (e) {
      throw new LogError(`ContributionMessage was not sent successfully: ${e}`, e)
    }
    if (!finalContribution || !finalContributionMessage) {
      throw new LogError('ContributionMessage was not sent successfully')
    }
    const moderator = getUser(context)

    if (messageType === ContributionMessageType.DIALOG) {
      // send email (never for moderator messages)
      await sendAddedContributionMessageEmail({
        firstName: finalContribution.user.firstName,
        lastName: finalContribution.user.lastName,
        email: finalContribution.user.emailContact.email,
        language: finalContribution.user.language,
        senderFirstName: moderator.firstName,
        senderLastName: moderator.lastName,
        contributionMemo: finalContribution.memo,
        contributionFrontendLink: await contributionFrontendLink(
          finalContribution.id,
          finalContribution.createdAt,
        ),
        message: finalContributionMessage.message,
      })
    }

    await EVENT_ADMIN_CONTRIBUTION_MESSAGE_CREATE(
      { id: finalContribution.userId } as DbUser,
      moderator,
      finalContribution,
      finalContributionMessage,
    )
    return new ContributionMessage(finalContributionMessage)
  }
}
