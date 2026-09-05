import { ContributionMessageArgs } from '@arg/ContributionMessageArgs'
import { Paginated } from '@arg/Paginated'
import { Order } from '@enum/Order'
import { ContributionMessage, ContributionMessageListResult } from '@model/ContributionMessage'
import {
  AppDatabase,
  Contribution as DbContribution,
  ContributionMessage as DbContributionMessage,
} from 'database'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { EntityManager } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'
import { EVENT_CONTRIBUTION_MESSAGE_CREATE } from '@/event/Events'
import { UpdateUnconfirmedContributionContext } from '@/interactions/updateUnconfirmedContribution/UpdateUnconfirmedContribution.context'
import { Context, getClientTimezoneOffset, getRole, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

import { addModeratorMessageAs } from './util/addModeratorMessageAs'
import { findContributionMessages } from './util/findContributionMessages'
import { assertContributionInModeratorScope } from './util/moderatorCreationGroupScope'

const db = AppDatabase.getInstance()

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
    @Ctx() context: Context,
  ): Promise<ContributionMessageListResult> {
    await assertContributionInModeratorScope(contributionId, context.user?.userRoles?.[0])
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
    await assertContributionInModeratorScope(
      contributionMessageArgs.contributionId,
      context.user?.userRoles?.[0],
    )
    const moderator = getUser(context)
    const moderatorRole = getRole(context)
    const contributionMessage = await addModeratorMessageAs(
      contributionMessageArgs,
      moderator,
      moderatorRole,
      getClientTimezoneOffset(context),
    )
    return new ContributionMessage(contributionMessage)
  }
}
