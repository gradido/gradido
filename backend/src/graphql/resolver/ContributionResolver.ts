import {
  Contribution as DbContribution,
  Transaction as DbTransaction,
  User as DbUser,
  UserContact,
} from 'database'
import { Decimal } from 'decimal.js-light'
import { GraphQLResolveInfo } from 'graphql'
import {
  Arg,
  Args,
  Authorized,
  Ctx,
  FieldResolver,
  Info,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import { EntityManager, IsNull, getConnection } from 'typeorm'

import { AdminCreateContributionArgs } from '@arg/AdminCreateContributionArgs'
import { AdminUpdateContributionArgs } from '@arg/AdminUpdateContributionArgs'
import { ContributionArgs } from '@arg/ContributionArgs'
import { Paginated } from '@arg/Paginated'
import { SearchContributionsFilterArgs } from '@arg/SearchContributionsFilterArgs'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { AdminUpdateContribution } from '@model/AdminUpdateContribution'
import { Contribution, ContributionListResult } from '@model/Contribution'
import { Decay } from '@model/Decay'
import { OpenCreation } from '@model/OpenCreation'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import { User } from '@model/User'

import { RIGHTS } from '@/auth/RIGHTS'
import {
  sendContributionChangedByModeratorEmail,
  sendContributionConfirmedEmail,
  sendContributionDeletedEmail,
  sendContributionDeniedEmail,
} from '@/emails/sendEmailVariants'
import {
  EVENT_ADMIN_CONTRIBUTION_CONFIRM,
  EVENT_ADMIN_CONTRIBUTION_CREATE,
  EVENT_ADMIN_CONTRIBUTION_DELETE,
  EVENT_ADMIN_CONTRIBUTION_DENY,
  EVENT_ADMIN_CONTRIBUTION_UPDATE,
  EVENT_CONTRIBUTION_CREATE,
  EVENT_CONTRIBUTION_DELETE,
  EVENT_CONTRIBUTION_UPDATE,
} from '@/event/Events'
import { UpdateUnconfirmedContributionContext } from '@/interactions/updateUnconfirmedContribution/UpdateUnconfirmedContribution.context'
import { LogError } from '@/server/LogError'
import { Context, getClientTimezoneOffset, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import { calculateDecay } from '@/util/decay'
import { fullName } from '@/util/utilities'

import { ContributionMessage } from '@model/ContributionMessage'
import { ContributionMessageType } from '../enum/ContributionMessageType'
import { loadAllContributions, loadUserContributions } from './util/contributions'
import { getOpenCreations, getUserCreation, validateContribution } from './util/creations'
import { extractGraphQLFields, extractGraphQLFieldsForSelect } from './util/extractGraphQLFields'
import { findContributionMessages } from './util/findContributionMessages'
import { findContributions } from './util/findContributions'
import { getLastTransaction } from './util/getLastTransaction'
import { sendTransactionsToDltConnector } from './util/sendTransactionsToDltConnector'

@Resolver(() => Contribution)
export class ContributionResolver {
  @Authorized([RIGHTS.ADMIN_LIST_CONTRIBUTIONS])
  @Query(() => Contribution)
  async contribution(@Arg('id', () => Int) id: number): Promise<Contribution> {
    const dbContribution = await DbContribution.findOne({ where: { id } })
    if (!dbContribution) {
      throw new LogError('Contribution not found', id)
    }
    return new Contribution(dbContribution)
  }

  @Authorized([RIGHTS.CREATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async createContribution(
    @Args() { amount, memo, contributionDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)

    const user = getUser(context)
    const creations = await getUserCreation(user.id, clientTimezoneOffset)
    logger.trace('creations', creations)
    const contributionDateObj = new Date(contributionDate)
    validateContribution(creations, amount, contributionDateObj, clientTimezoneOffset)

    const contribution = DbContribution.create()
    contribution.userId = user.id
    contribution.amount = amount
    contribution.createdAt = new Date()
    contribution.contributionDate = contributionDateObj
    contribution.memo = memo
    contribution.contributionType = ContributionType.USER
    contribution.contributionStatus = ContributionStatus.PENDING

    logger.trace('contribution to save', contribution)
    await DbContribution.save(contribution)
    await EVENT_CONTRIBUTION_CREATE(user, contribution, amount)

    return new UnconfirmedContribution(contribution)
  }

  @Authorized([RIGHTS.DELETE_CONTRIBUTION])
  @Mutation(() => Boolean)
  async deleteContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    const contribution = await DbContribution.findOne({ where: { id } })
    if (!contribution) {
      throw new LogError('Contribution not found', id)
    }
    if (contribution.userId !== user.id) {
      throw new LogError('Can not delete contribution of another user', contribution, user.id)
    }
    if (contribution.confirmedAt) {
      throw new LogError('A confirmed contribution can not be deleted', contribution)
    }

    contribution.contributionStatus = ContributionStatus.DELETED
    contribution.deletedBy = user.id
    contribution.deletedAt = new Date()
    await contribution.save()
    await EVENT_CONTRIBUTION_DELETE(user, contribution, contribution.amount)

    const res = await contribution.softRemove()
    return !!res
  }

  @Authorized([RIGHTS.LIST_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async listContributions(
    @Ctx() context: Context,
    @Arg('pagination') pagination: Paginated,
    @Arg('messagePagination', { nullable: true }) messagePagination?: Paginated,
  ): Promise<ContributionListResult> {
    const user = getUser(context)
    const [dbContributions, count] = await loadUserContributions(
      user.id,
      pagination,
      messagePagination,
    )

    // show contributions in progress first
    const inProgressContributions = dbContributions.filter(
      (contribution) => contribution.contributionStatus === ContributionStatus.IN_PROGRESS,
    )
    const notInProgressContributions = dbContributions.filter(
      (contribution) => contribution.contributionStatus !== ContributionStatus.IN_PROGRESS,
    )

    return new ContributionListResult(
      count,
      [...inProgressContributions, ...notInProgressContributions].map((contribution) => {
        // we currently expect not much contribution messages for needing pagination
        // but if we get more than expected, we should get warned
        if ((contribution.messages?.length || 0) > (messagePagination?.pageSize || 10)) {
          logger.warn('more contribution messages as expected, consider pagination', {
            contributionId: contribution.id,
            expected: messagePagination?.pageSize || 10,
            actual: contribution.messages?.length || 0,
          })
        }
        // remove moderator messages
        contribution.messages = contribution.messages?.filter(
          (message) => message.type !== ContributionMessageType.MODERATOR,
        )
        return contribution
      }),
    )
  }

  @Authorized([RIGHTS.LIST_CONTRIBUTIONS])
  @Query(() => Int)
  async countContributionsInProgress(@Ctx() context: Context): Promise<number> {
    const user = getUser(context)
    const count = await DbContribution.count({
      select: { id: true },
      where: { userId: user.id, contributionStatus: ContributionStatus.IN_PROGRESS },
    })
    return count
  }

  @Authorized([RIGHTS.LIST_ALL_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async listAllContributions(
    @Arg('pagination') pagination: Paginated,
  ): Promise<ContributionListResult> {
    const [dbContributions, count] = await loadAllContributions(pagination)
    return new ContributionListResult(count, dbContributions)
  }

  @Authorized([RIGHTS.UPDATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async updateContribution(
    @Arg('contributionId', () => Int)
    contributionId: number,
    @Args() contributionArgs: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const updateUnconfirmedContributionContext = new UpdateUnconfirmedContributionContext(
      contributionId,
      contributionArgs,
      context,
    )
    const { contribution, contributionMessage } = await updateUnconfirmedContributionContext.run()
    await getConnection().transaction(async (transactionalEntityManager: EntityManager) => {
      await transactionalEntityManager.save(contribution)
      if (contributionMessage) {
        await transactionalEntityManager.save(contributionMessage)
      }
    })
    const user = getUser(context)
    await EVENT_CONTRIBUTION_UPDATE(user, contribution, contributionArgs.amount)

    return new UnconfirmedContribution(contribution)
  }

  @Authorized([RIGHTS.ADMIN_CREATE_CONTRIBUTION])
  @Mutation(() => [Decimal])
  async adminCreateContribution(
    @Args() { email, amount, memo, creationDate }: AdminCreateContributionArgs,
    @Ctx() context: Context,
  ): Promise<Decimal[]> {
    logger.info(
      `adminCreateContribution(email=${email}, amount=${amount.toString()}, memo=${memo}, creationDate=${creationDate})`,
    )
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const emailContact = await UserContact.findOne({
      where: { email },
      withDeleted: true,
      relations: ['user'],
    })
    if (!emailContact?.user) {
      throw new LogError('Could not find user', email)
    }
    if (emailContact.deletedAt || emailContact.user.deletedAt) {
      throw new LogError('Cannot create contribution since the user was deleted', emailContact)
    }
    if (!emailContact.emailChecked) {
      throw new LogError(
        'Cannot create contribution since the users email is not activated',
        emailContact,
      )
    }

    const moderator = getUser(context)
    logger.trace('moderator: ', moderator.id)
    const creations = await getUserCreation(emailContact.userId, clientTimezoneOffset)
    logger.trace('creations:', creations)
    const creationDateObj = new Date(creationDate)
    logger.trace('creationDateObj:', creationDateObj)
    validateContribution(creations, amount, creationDateObj, clientTimezoneOffset)
    const contribution = DbContribution.create()
    contribution.userId = emailContact.userId
    contribution.amount = amount
    contribution.createdAt = new Date()
    contribution.contributionDate = creationDateObj
    contribution.memo = memo
    contribution.moderatorId = moderator.id
    contribution.contributionType = ContributionType.ADMIN
    contribution.contributionStatus = ContributionStatus.PENDING
    logger.trace('contribution to save', contribution)
    await DbContribution.save(contribution)
    await EVENT_ADMIN_CONTRIBUTION_CREATE(emailContact.user, moderator, contribution, amount)

    return getUserCreation(emailContact.userId, clientTimezoneOffset)
  }

  @Authorized([RIGHTS.ADMIN_UPDATE_CONTRIBUTION])
  @Mutation(() => AdminUpdateContribution)
  async adminUpdateContribution(
    @Args() adminUpdateContributionArgs: AdminUpdateContributionArgs,
    @Ctx() context: Context,
  ): Promise<AdminUpdateContribution> {
    const updateUnconfirmedContributionContext = new UpdateUnconfirmedContributionContext(
      adminUpdateContributionArgs.id,
      adminUpdateContributionArgs,
      context,
    )
    const { contribution, contributionMessage, createdByUserChangedByModerator } =
      await updateUnconfirmedContributionContext.run()
    await getConnection().transaction(async (transactionalEntityManager: EntityManager) => {
      await transactionalEntityManager.save(contribution)
      // TODO: move into specialized view or formatting for logging class
      logger.debug('saved changed contribution', {
        id: contribution.id,
        amount: contribution.amount.toString(),
        memo: contribution.memo,
        contributionDate: contribution.contributionDate.toString(),
        resubmissionAt: contribution.resubmissionAt?.toString(),
        status: contribution.contributionStatus.toString(),
      })
      if (contributionMessage) {
        await transactionalEntityManager.save(contributionMessage)
        // TODO: move into specialized view or formatting for logging class
        logger.debug('save new contributionMessage', {
          contributionId: contributionMessage.contributionId,
          type: contributionMessage.type,
          message: contributionMessage.message,
          isModerator: contributionMessage.isModerator,
        })
      }
    })
    const moderator = getUser(context)

    const result = new AdminUpdateContribution()
    result.amount = contribution.amount
    result.memo = contribution.memo
    result.date = contribution.contributionDate

    await EVENT_ADMIN_CONTRIBUTION_UPDATE(
      { id: contribution.userId } as DbUser,
      moderator,
      contribution,
      contribution.amount,
    )
    if (createdByUserChangedByModerator && adminUpdateContributionArgs.memo) {
      const user = await DbUser.findOneOrFail({
        where: { id: contribution.userId },
        relations: ['emailContact'],
      })

      await sendContributionChangedByModeratorEmail({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailContact.email,
        language: user.language,
        senderFirstName: moderator.firstName,
        senderLastName: moderator.lastName,
        contributionMemo: updateUnconfirmedContributionContext.getOldMemo(),
        contributionMemoUpdated: contribution.memo,
      })
    }

    return result
  }

  @Authorized([RIGHTS.ADMIN_LIST_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async adminListContributions(
    @Arg('filter', () => SearchContributionsFilterArgs, {
      defaultValue: new SearchContributionsFilterArgs(),
    })
    filter: SearchContributionsFilterArgs,
    @Arg('paginated', () => Paginated, { defaultValue: new Paginated() }) paginated: Paginated,
    @Info() info: GraphQLResolveInfo,
  ): Promise<ContributionListResult> {
    // Check if only count was requested (without contributionList)
    const fields = Object.keys(extractGraphQLFields(info))
    const countOnly: boolean = fields.includes('contributionCount') && fields.length === 1
    // check if related user was requested
    const userRequested =
      fields.includes('user') || filter.userId !== undefined || filter.query !== undefined
    // check if related emailContact was requested
    const emailContactRequested = fields.includes('user.emailContact') || filter.query !== undefined
    // check if related messages were requested
    const messagesRequested = ['messagesCount', 'messages'].some((field) => fields.includes(field))
    const [dbContributions, count] = await findContributions(
      paginated,
      filter,
      true,
      {
        user: userRequested
          ? {
              emailContact: emailContactRequested,
            }
          : false,
        messages: messagesRequested,
      },
      countOnly,
    )

    return new ContributionListResult(count, dbContributions)
  }

  @Authorized([RIGHTS.ADMIN_DELETE_CONTRIBUTION])
  @Mutation(() => Boolean)
  async adminDeleteContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const contribution = await DbContribution.findOne({ where: { id } })
    if (!contribution) {
      throw new LogError('Contribution not found', id)
    }
    if (contribution.confirmedAt) {
      throw new LogError('A confirmed contribution can not be deleted')
    }
    const moderator = getUser(context)
    if (
      (contribution.contributionType as ContributionType) === ContributionType.USER &&
      contribution.userId === moderator.id
    ) {
      throw new LogError('Own contribution can not be deleted as admin')
    }
    const user = await DbUser.findOneOrFail({
      where: { id: contribution.userId },
      relations: ['emailContact'],
    })
    contribution.contributionStatus = ContributionStatus.DELETED
    contribution.deletedBy = moderator.id
    await contribution.save()
    const res = await contribution.softRemove()
    await EVENT_ADMIN_CONTRIBUTION_DELETE(
      { id: contribution.userId } as DbUser,
      moderator,
      contribution,
      contribution.amount,
    )
    await sendContributionDeletedEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailContact.email,
      language: user.language,
      senderFirstName: moderator.firstName,
      senderLastName: moderator.lastName,
      contributionMemo: contribution.memo,
    })

    return !!res
  }

  @Authorized([RIGHTS.CONFIRM_CONTRIBUTION])
  @Mutation(() => Boolean)
  async confirmContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    // acquire lock
    const releaseLock = await TRANSACTIONS_LOCK.acquire()
    try {
      const clientTimezoneOffset = getClientTimezoneOffset(context)
      const contribution = await DbContribution.findOne({ where: { id } })
      if (!contribution) {
        throw new LogError('Contribution not found', id)
      }
      if (contribution.confirmedAt) {
        throw new LogError('Contribution already confirmed', id)
      }
      if (contribution.contributionStatus === 'DENIED') {
        throw new LogError('Contribution already denied', id)
      }
      const moderatorUser = getUser(context)
      if (moderatorUser.id === contribution.userId) {
        throw new LogError('Moderator can not confirm own contribution')
      }
      const user = await DbUser.findOneOrFail({
        where: { id: contribution.userId },
        withDeleted: true,
        relations: ['emailContact'],
      })
      if (user.deletedAt) {
        throw new LogError('Can not confirm contribution since the user was deleted')
      }
      const creations = await getUserCreation(contribution.userId, clientTimezoneOffset, false)
      validateContribution(
        creations,
        contribution.amount,
        contribution.contributionDate,
        clientTimezoneOffset,
      )

      const receivedCallDate = new Date()
      const queryRunner = getConnection().createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction('REPEATABLE READ') // 'READ COMMITTED')

      const lastTransaction = await getLastTransaction(contribution.userId)
      logger.info('lastTransaction ID', lastTransaction ? lastTransaction.id : 'undefined')

      try {
        let newBalance = new Decimal(0)
        let decay: Decay | null = null
        if (lastTransaction) {
          decay = calculateDecay(
            lastTransaction.balance,
            lastTransaction.balanceDate,
            receivedCallDate,
          )
          newBalance = decay.balance
        }
        newBalance = newBalance.add(contribution.amount.toString())

        const transaction = new DbTransaction()
        transaction.typeId = TransactionTypeId.CREATION
        transaction.memo = contribution.memo
        transaction.userId = contribution.userId
        transaction.userGradidoID = user.gradidoID
        transaction.userName = fullName(user.firstName, user.lastName)
        transaction.userCommunityUuid = user.communityUuid
        transaction.linkedUserId = moderatorUser.id
        transaction.linkedUserGradidoID = moderatorUser.gradidoID
        transaction.linkedUserName = fullName(moderatorUser.firstName, moderatorUser.lastName)
        transaction.linkedUserCommunityUuid = moderatorUser.communityUuid
        transaction.previous = lastTransaction ? lastTransaction.id : null
        transaction.amount = contribution.amount
        transaction.creationDate = contribution.contributionDate
        transaction.balance = newBalance
        transaction.balanceDate = receivedCallDate
        transaction.decay = decay ? decay.decay : new Decimal(0)
        transaction.decayStart = decay ? decay.start : null
        await queryRunner.manager.insert(DbTransaction, transaction)

        contribution.confirmedAt = receivedCallDate
        contribution.confirmedBy = moderatorUser.id
        contribution.transactionId = transaction.id
        contribution.contributionStatus = ContributionStatus.CONFIRMED
        await queryRunner.manager.update(DbContribution, { id: contribution.id }, contribution)

        await queryRunner.commitTransaction()

        // trigger to send transaction via dlt-connector
        await sendTransactionsToDltConnector()

        logger.info('creation commited successfuly.')
        await sendContributionConfirmedEmail({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.emailContact.email,
          language: user.language,
          senderFirstName: moderatorUser.firstName,
          senderLastName: moderatorUser.lastName,
          contributionMemo: contribution.memo,
          contributionAmount: contribution.amount,
        })
      } catch (e) {
        await queryRunner.rollbackTransaction()
        throw new LogError('Creation was not successful', e)
      } finally {
        await queryRunner.release()
      }
      await EVENT_ADMIN_CONTRIBUTION_CONFIRM(user, moderatorUser, contribution, contribution.amount)
    } finally {
      releaseLock()
    }
    return true
  }

  @Authorized([RIGHTS.OPEN_CREATIONS])
  @Query(() => [OpenCreation])
  async openCreations(@Ctx() context: Context): Promise<OpenCreation[]> {
    return getOpenCreations(getUser(context).id, getClientTimezoneOffset(context))
  }

  @Authorized([RIGHTS.ADMIN_OPEN_CREATIONS])
  @Query(() => [OpenCreation])
  async adminOpenCreations(
    @Arg('userId', () => Int) userId: number,
    @Ctx() context: Context,
  ): Promise<OpenCreation[]> {
    return getOpenCreations(userId, getClientTimezoneOffset(context))
  }

  @Authorized([RIGHTS.DENY_CONTRIBUTION])
  @Mutation(() => Boolean)
  async denyContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const contributionToUpdate = await DbContribution.findOne({
      where: {
        id,
        confirmedAt: IsNull(),
        deniedBy: IsNull(),
      },
    })
    if (!contributionToUpdate) {
      throw new LogError('Contribution not found', id)
    }
    if (
      (contributionToUpdate.contributionStatus as ContributionStatus) !==
        ContributionStatus.IN_PROGRESS &&
      (contributionToUpdate.contributionStatus as ContributionStatus) !== ContributionStatus.PENDING
    ) {
      throw new LogError(
        'Status of the contribution is not allowed',
        contributionToUpdate.contributionStatus,
      )
    }
    const moderator = getUser(context)
    const user = await DbUser.findOne({
      where: { id: contributionToUpdate.userId },
      relations: ['emailContact'],
    })
    if (!user) {
      throw new LogError('Could not find User of the Contribution', contributionToUpdate.userId)
    }

    contributionToUpdate.contributionStatus = ContributionStatus.DENIED
    contributionToUpdate.deniedBy = moderator.id
    contributionToUpdate.deniedAt = new Date()
    const res = await contributionToUpdate.save()
    await EVENT_ADMIN_CONTRIBUTION_DENY(
      user,
      moderator,
      contributionToUpdate,
      contributionToUpdate.amount,
    )

    await sendContributionDeniedEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailContact.email,
      language: user.language,
      senderFirstName: moderator.firstName,
      senderLastName: moderator.lastName,
      contributionMemo: contributionToUpdate.memo,
    })

    return !!res
  }

  // Field resolvers
  @Authorized([RIGHTS.USER])
  @FieldResolver(() => User, { nullable: true })
  async user(
    @Root() contribution: DbContribution,
    @Info() info: GraphQLResolveInfo,
  ): Promise<User | null> {
    let user: DbUser | null = contribution.user
    if (!user) {
      const queryBuilder = DbUser.createQueryBuilder('user')
      queryBuilder.where('user.id = :userId', { userId: contribution.userId })
      extractGraphQLFieldsForSelect(info, queryBuilder, 'user')
      user = await queryBuilder.getOne()
    }
    if (user) {
      return new User(user)
    }
    return null
  }

  @Authorized([RIGHTS.LIST_ALL_CONTRIBUTION_MESSAGES])
  @FieldResolver(() => [ContributionMessage], { nullable: true })
  async messages(
    @Root() contribution: UnconfirmedContribution,
    @Arg('pagination', () => Paginated) pagination: Paginated,
  ): Promise<ContributionMessage[] | null> {
    if (contribution.messagesCount === 0) {
      return null
    }
    const [contributionMessages] = await findContributionMessages({
      contributionId: contribution.id,
      pagination,
    })
    // we currently expect not much contribution messages for needing pagination
    // but if we get more than expected, we should get warned
    if (contributionMessages.length > pagination.pageSize) {
      logger.warn('more contribution messages as expected, consider pagination', {
        contributionId: contribution.id,
        expected: pagination.pageSize,
        actual: contributionMessages.length,
      })
    }

    return contributionMessages.map((message) => new ContributionMessage(message))
  }
}
