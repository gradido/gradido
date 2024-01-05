import { EntityManager, IsNull, getConnection } from '@dbTools/typeorm'
import { Contribution as DbContribution } from '@entity/Contribution'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { User as DbUser } from '@entity/User'
import { UserContact } from '@entity/UserContact'
import { Decimal } from 'decimal.js-light'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'

import { AdminCreateContributionArgs } from '@arg/AdminCreateContributionArgs'
import { AdminUpdateContributionArgs } from '@arg/AdminUpdateContributionArgs'
import { ContributionArgs } from '@arg/ContributionArgs'
import { Paginated } from '@arg/Paginated'
import { SearchContributionsFilterArgs } from '@arg/SearchContributionsFilterArgs'
import { ContributionMessageType } from '@enum/ContributionMessageType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionType } from '@enum/ContributionType'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { AdminUpdateContribution } from '@model/AdminUpdateContribution'
import { Contribution, ContributionListResult } from '@model/Contribution'
import { Decay } from '@model/Decay'
import { OpenCreation } from '@model/OpenCreation'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'

import { RIGHTS } from '@/auth/RIGHTS'
import {
  sendContributionChangedByModeratorEmail,
  sendContributionConfirmedEmail,
  sendContributionDeletedEmail,
  sendContributionDeniedEmail,
} from '@/emails/sendEmailVariants'
import {
  EVENT_CONTRIBUTION_CREATE,
  EVENT_CONTRIBUTION_DELETE,
  EVENT_CONTRIBUTION_UPDATE,
  EVENT_ADMIN_CONTRIBUTION_CREATE,
  EVENT_ADMIN_CONTRIBUTION_UPDATE,
  EVENT_ADMIN_CONTRIBUTION_DELETE,
  EVENT_ADMIN_CONTRIBUTION_CONFIRM,
  EVENT_ADMIN_CONTRIBUTION_DENY,
} from '@/event/Events'
import { UpdateUnconfirmedContributionContext } from '@/interactions/updateUnconfirmedContribution/UpdateUnconfirmedContribution.context'
import { Context, getUser, getClientTimezoneOffset } from '@/server/context'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { calculateDecay } from '@/util/decay'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import { fullName } from '@/util/utilities'

import { findContribution } from './util/contributions'
import { getUserCreation, validateContribution, getOpenCreations } from './util/creations'
import { findContributions } from './util/findContributions'
import { getLastTransaction } from './util/getLastTransaction'
import { sendTransactionsToDltConnector } from './util/sendTransactionsToDltConnector'

@Resolver()
export class ContributionResolver {
  @Authorized([RIGHTS.ADMIN_LIST_CONTRIBUTIONS])
  @Query(() => Contribution)
  async contribution(@Arg('id', () => Int) id: number): Promise<Contribution> {
    const contribution = await findContribution(id)
    if (!contribution) {
      throw new LogError('Contribution not found', id)
    }
    return new Contribution(contribution)
  }

  @Authorized([RIGHTS.CREATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async createContribution(
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)

    const user = getUser(context)
    const creations = await getUserCreation(user.id, clientTimezoneOffset)
    logger.trace('creations', creations)
    const creationDateObj = new Date(creationDate)
    validateContribution(creations, amount, creationDateObj, clientTimezoneOffset)

    const contribution = DbContribution.create()
    contribution.userId = user.id
    contribution.amount = amount
    contribution.createdAt = new Date()
    contribution.contributionDate = creationDateObj
    contribution.memo = memo
    contribution.contributionType = ContributionType.USER
    contribution.contributionStatus = ContributionStatus.PENDING

    logger.trace('contribution to save', contribution)
    await DbContribution.save(contribution)
    await EVENT_CONTRIBUTION_CREATE(user, contribution, amount)

    return new UnconfirmedContribution(contribution, user, creations)
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
    @Args()
    paginated: Paginated,
    @Arg('statusFilter', () => [ContributionStatus], { nullable: true })
    statusFilter?: ContributionStatus[] | null,
  ): Promise<ContributionListResult> {
    const user = getUser(context)
    const filter = new SearchContributionsFilterArgs()
    filter.statusFilter = statusFilter
    filter.userId = user.id
    const [dbContributions, count] = await findContributions(paginated, filter, true, {
      messages: true,
    })

    return new ContributionListResult(
      count,
      dbContributions.map((contribution) => {
        // filter out moderator messages for this call
        contribution.messages = contribution.messages?.filter(
          (m) => m.type !== ContributionMessageType.MODERATOR,
        )
        return new Contribution(contribution, user)
      }),
    )
  }

  @Authorized([RIGHTS.LIST_ALL_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async listAllContributions(
    @Args()
    paginated: Paginated,
    @Arg('statusFilter', () => [ContributionStatus], { nullable: true })
    statusFilter?: ContributionStatus[] | null,
  ): Promise<ContributionListResult> {
    const filter = new SearchContributionsFilterArgs()
    filter.statusFilter = statusFilter
    const [dbContributions, count] = await findContributions(paginated, filter, false, {
      user: true,
    })

    return new ContributionListResult(
      count,
      dbContributions.map((contribution) => new Contribution(contribution, contribution.user)),
    )
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
    const { contribution, contributionMessage, availableCreationSums } =
      await updateUnconfirmedContributionContext.run()
    await getConnection().transaction(async (transactionalEntityManager: EntityManager) => {
      await transactionalEntityManager.save(contribution)
      if (contributionMessage) {
        await transactionalEntityManager.save(contributionMessage)
      }
    })
    const user = getUser(context)
    await EVENT_CONTRIBUTION_UPDATE(user, contribution, contributionArgs.amount)

    return new UnconfirmedContribution(contribution, user, availableCreationSums)
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

      void sendContributionChangedByModeratorEmail({
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
    @Args() paginated: Paginated,
    @Args() filter: SearchContributionsFilterArgs,
  ): Promise<ContributionListResult> {
    const [dbContributions, count] = await findContributions(paginated, filter, true, {
      user: {
        emailContact: true,
      },
      messages: true,
    })

    return new ContributionListResult(
      count,
      dbContributions.map((contribution) => new Contribution(contribution, contribution.user)),
    )
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
      contribution.contributionType === ContributionType.USER &&
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
    void sendContributionDeletedEmail({
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
        transaction.linkedUserId = moderatorUser.id
        transaction.linkedUserGradidoID = moderatorUser.gradidoID
        transaction.linkedUserName = fullName(moderatorUser.firstName, moderatorUser.lastName)
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
        void sendTransactionsToDltConnector()

        logger.info('creation commited successfuly.')
        void sendContributionConfirmedEmail({
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
      contributionToUpdate.contributionStatus !== ContributionStatus.IN_PROGRESS &&
      contributionToUpdate.contributionStatus !== ContributionStatus.PENDING
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

    void sendContributionDeniedEmail({
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
}
