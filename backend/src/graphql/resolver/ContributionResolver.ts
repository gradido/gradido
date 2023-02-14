import Decimal from 'decimal.js-light'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { FindOperator, IsNull, In, getConnection } from '@dbTools/typeorm'

import { Contribution as DbContribution } from '@entity/Contribution'
import { ContributionMessage } from '@entity/ContributionMessage'
import { UserContact } from '@entity/UserContact'
import { User as DbUser } from '@entity/User'
import { Transaction as DbTransaction } from '@entity/Transaction'

import { AdminCreateContributions } from '@model/AdminCreateContributions'
import { AdminUpdateContribution } from '@model/AdminUpdateContribution'
import { Contribution, ContributionListResult } from '@model/Contribution'
import { Decay } from '@model/Decay'
import { OpenCreation } from '@model/OpenCreation'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { Order } from '@enum/Order'
import { ContributionType } from '@enum/ContributionType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { ContributionMessageType } from '@enum/MessageType'
import ContributionArgs from '@arg/ContributionArgs'
import Paginated from '@arg/Paginated'
import AdminCreateContributionArgs from '@arg/AdminCreateContributionArgs'
import AdminUpdateContributionArgs from '@arg/AdminUpdateContributionArgs'

import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser, getClientTimezoneOffset } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import {
  getCreationDates,
  getUserCreation,
  getUserCreations,
  validateContribution,
  updateCreations,
  isValidDateString,
} from './util/creations'
import { MEMO_MAX_CHARS, MEMO_MIN_CHARS, FULL_CREATION_AVAILABLE } from './const/const'
import {
  Event,
  EventContributionCreate,
  EventContributionDelete,
  EventContributionUpdate,
  EventContributionConfirm,
  EventAdminContributionCreate,
  EventAdminContributionDelete,
  EventAdminContributionDeny,
  EventAdminContributionUpdate,
} from '@/event/Event'
import { writeEvent } from '@/event/EventProtocolEmitter'
import { calculateDecay } from '@/util/decay'
import {
  sendContributionConfirmedEmail,
  sendContributionDeletedEmail,
  sendContributionDeniedEmail,
} from '@/emails/sendEmailVariants'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import LogError from '@/server/LogError'

import { getLastTransaction } from './util/getLastTransaction'

@Resolver()
export class ContributionResolver {
  @Authorized([RIGHTS.CREATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async createContribution(
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    if (memo.length < MEMO_MIN_CHARS) {
      throw new LogError('Memo text is too short', memo.length)
    }
    if (memo.length > MEMO_MAX_CHARS) {
      throw new LogError('Memo text is too long', memo.length)
    }

    const event = new Event()

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

    const eventCreateContribution = new EventContributionCreate()
    eventCreateContribution.userId = user.id
    eventCreateContribution.amount = amount
    eventCreateContribution.contributionId = contribution.id
    await writeEvent(event.setEventContributionCreate(eventCreateContribution))

    return new UnconfirmedContribution(contribution, user, creations)
  }

  @Authorized([RIGHTS.DELETE_CONTRIBUTION])
  @Mutation(() => Boolean)
  async deleteContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const event = new Event()
    const user = getUser(context)
    const contribution = await DbContribution.findOne(id)
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

    const eventDeleteContribution = new EventContributionDelete()
    eventDeleteContribution.userId = user.id
    eventDeleteContribution.contributionId = contribution.id
    eventDeleteContribution.amount = contribution.amount
    await writeEvent(event.setEventContributionDelete(eventDeleteContribution))

    const res = await contribution.softRemove()
    return !!res
  }

  @Authorized([RIGHTS.LIST_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async listContributions(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Arg('filterConfirmed', () => Boolean)
    filterConfirmed: boolean | null,
    @Ctx() context: Context,
  ): Promise<ContributionListResult> {
    const user = getUser(context)
    const where: {
      userId: number
      confirmedBy?: FindOperator<number> | null
    } = { userId: user.id }

    if (filterConfirmed) where.confirmedBy = IsNull()

    const [contributions, count] = await getConnection()
      .createQueryBuilder()
      .select('c')
      .from(DbContribution, 'c')
      .leftJoinAndSelect('c.messages', 'm')
      .where(where)
      .withDeleted()
      .orderBy('c.createdAt', order)
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize)
      .getManyAndCount()

    return new ContributionListResult(
      count,
      contributions.map((contribution) => new Contribution(contribution, user)),
    )
  }

  @Authorized([RIGHTS.LIST_ALL_CONTRIBUTIONS])
  @Query(() => ContributionListResult)
  async listAllContributions(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Arg('statusFilter', () => [ContributionStatus], { nullable: true })
    statusFilter?: ContributionStatus[],
  ): Promise<ContributionListResult> {
    const where: {
      contributionStatus?: FindOperator<string> | null
    } = {}

    if (statusFilter && statusFilter.length) {
      where.contributionStatus = In(statusFilter)
    }

    const [dbContributions, count] = await getConnection()
      .createQueryBuilder()
      .select('c')
      .from(DbContribution, 'c')
      .innerJoinAndSelect('c.user', 'u')
      .where(where)
      .orderBy('c.createdAt', order)
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize)
      .getManyAndCount()
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
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    if (memo.length < MEMO_MIN_CHARS) {
      throw new LogError('Memo text is too short', memo.length)
    }
    if (memo.length > MEMO_MAX_CHARS) {
      throw new LogError('Memo text is too long', memo.length)
    }

    const user = getUser(context)

    const contributionToUpdate = await DbContribution.findOne({
      where: { id: contributionId, confirmedAt: IsNull(), deniedAt: IsNull() },
    })
    if (!contributionToUpdate) {
      throw new LogError('Contribution not found', contributionId)
    }
    if (contributionToUpdate.userId !== user.id) {
      throw new LogError(
        'Can not update contribution of another user',
        contributionToUpdate,
        user.id,
      )
    }
    if (
      contributionToUpdate.contributionStatus !== ContributionStatus.IN_PROGRESS &&
      contributionToUpdate.contributionStatus !== ContributionStatus.PENDING
    ) {
      throw new LogError(
        'Contribution can not be updated due to status',
        contributionToUpdate.contributionStatus,
      )
    }
    const creationDateObj = new Date(creationDate)
    let creations = await getUserCreation(user.id, clientTimezoneOffset)
    if (contributionToUpdate.contributionDate.getMonth() === creationDateObj.getMonth()) {
      creations = updateCreations(creations, contributionToUpdate, clientTimezoneOffset)
    } else {
      throw new LogError('Month of contribution can not be changed')
    }

    // all possible cases not to be true are thrown in this function
    validateContribution(creations, amount, creationDateObj, clientTimezoneOffset)

    const contributionMessage = ContributionMessage.create()
    contributionMessage.contributionId = contributionId
    contributionMessage.createdAt = contributionToUpdate.updatedAt
      ? contributionToUpdate.updatedAt
      : contributionToUpdate.createdAt
    const changeMessage = `${contributionToUpdate.contributionDate}
    ---
    ${contributionToUpdate.memo}
    ---
    ${contributionToUpdate.amount}`
    contributionMessage.message = changeMessage
    contributionMessage.isModerator = false
    contributionMessage.userId = user.id
    contributionMessage.type = ContributionMessageType.HISTORY
    ContributionMessage.save(contributionMessage)

    contributionToUpdate.amount = amount
    contributionToUpdate.memo = memo
    contributionToUpdate.contributionDate = new Date(creationDate)
    contributionToUpdate.contributionStatus = ContributionStatus.PENDING
    contributionToUpdate.updatedAt = new Date()
    DbContribution.save(contributionToUpdate)

    const event = new Event()

    const eventUpdateContribution = new EventContributionUpdate()
    eventUpdateContribution.userId = user.id
    eventUpdateContribution.contributionId = contributionId
    eventUpdateContribution.amount = amount
    await writeEvent(event.setEventContributionUpdate(eventUpdateContribution))

    return new UnconfirmedContribution(contributionToUpdate, user, creations)
  }

  @Authorized([RIGHTS.ADMIN_CREATE_CONTRIBUTION])
  @Mutation(() => [Number])
  async adminCreateContribution(
    @Args() { email, amount, memo, creationDate }: AdminCreateContributionArgs,
    @Ctx() context: Context,
  ): Promise<Decimal[]> {
    logger.info(
      `adminCreateContribution(email=${email}, amount=${amount}, memo=${memo}, creationDate=${creationDate})`,
    )
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    if (!isValidDateString(creationDate)) {
      throw new LogError('CreationDate is invalid', creationDate)
    }
    const emailContact = await UserContact.findOne({
      where: { email },
      withDeleted: true,
      relations: ['user'],
    })
    if (!emailContact || !emailContact.user) {
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

    const event = new Event()
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

    const eventAdminCreateContribution = new EventAdminContributionCreate()
    eventAdminCreateContribution.userId = moderator.id
    eventAdminCreateContribution.amount = amount
    eventAdminCreateContribution.contributionId = contribution.id
    await writeEvent(event.setEventAdminContributionCreate(eventAdminCreateContribution))

    return getUserCreation(emailContact.userId, clientTimezoneOffset)
  }

  @Authorized([RIGHTS.ADMIN_CREATE_CONTRIBUTIONS])
  @Mutation(() => AdminCreateContributions)
  async adminCreateContributions(
    @Arg('pendingCreations', () => [AdminCreateContributionArgs])
    contributions: AdminCreateContributionArgs[],
    @Ctx() context: Context,
  ): Promise<AdminCreateContributions> {
    let success = false
    const successfulContribution: string[] = []
    const failedContribution: string[] = []
    for (const contribution of contributions) {
      await this.adminCreateContribution(contribution, context)
        .then(() => {
          successfulContribution.push(contribution.email)
          success = true
        })
        .catch(() => {
          failedContribution.push(contribution.email)
        })
    }
    return {
      success,
      successfulContribution,
      failedContribution,
    }
  }

  @Authorized([RIGHTS.ADMIN_UPDATE_CONTRIBUTION])
  @Mutation(() => AdminUpdateContribution)
  async adminUpdateContribution(
    @Args() { id, email, amount, memo, creationDate }: AdminUpdateContributionArgs,
    @Ctx() context: Context,
  ): Promise<AdminUpdateContribution> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const emailContact = await UserContact.findOne({
      where: { email },
      withDeleted: true,
      relations: ['user'],
    })
    if (!emailContact || !emailContact.user) {
      throw new LogError('Could not find User', email)
    }
    if (emailContact.deletedAt || emailContact.user.deletedAt) {
      throw new LogError('User was deleted', email)
    }

    const moderator = getUser(context)

    const contributionToUpdate = await DbContribution.findOne({
      where: { id, confirmedAt: IsNull(), deniedAt: IsNull() },
    })
    if (!contributionToUpdate) {
      throw new LogError('Contribution not found', id)
    }

    if (contributionToUpdate.userId !== emailContact.user.id) {
      throw new LogError('User of the pending contribution and send user does not correspond')
    }

    if (contributionToUpdate.moderatorId === null) {
      throw new LogError('An admin is not allowed to update an user contribution')
    }

    const creationDateObj = new Date(creationDate)
    let creations = await getUserCreation(emailContact.user.id, clientTimezoneOffset)

    // TODO: remove this restriction
    if (contributionToUpdate.contributionDate.getMonth() === creationDateObj.getMonth()) {
      creations = updateCreations(creations, contributionToUpdate, clientTimezoneOffset)
    } else {
      throw new LogError('Month of contribution can not be changed')
    }

    // all possible cases not to be true are thrown in this function
    validateContribution(creations, amount, creationDateObj, clientTimezoneOffset)
    contributionToUpdate.amount = amount
    contributionToUpdate.memo = memo
    contributionToUpdate.contributionDate = new Date(creationDate)
    contributionToUpdate.moderatorId = moderator.id
    contributionToUpdate.contributionStatus = ContributionStatus.PENDING

    await DbContribution.save(contributionToUpdate)

    const result = new AdminUpdateContribution()
    result.amount = amount
    result.memo = contributionToUpdate.memo
    result.date = contributionToUpdate.contributionDate

    result.creation = await getUserCreation(emailContact.user.id, clientTimezoneOffset)

    const event = new Event()
    const eventAdminContributionUpdate = new EventAdminContributionUpdate()
    eventAdminContributionUpdate.userId = emailContact.user.id
    eventAdminContributionUpdate.amount = amount
    eventAdminContributionUpdate.contributionId = contributionToUpdate.id
    await writeEvent(event.setEventAdminContributionUpdate(eventAdminContributionUpdate))

    return result
  }

  @Authorized([RIGHTS.LIST_UNCONFIRMED_CONTRIBUTIONS])
  @Query(() => [UnconfirmedContribution])
  async listUnconfirmedContributions(@Ctx() context: Context): Promise<UnconfirmedContribution[]> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const contributions = await getConnection()
      .createQueryBuilder()
      .select('c')
      .from(DbContribution, 'c')
      .leftJoinAndSelect('c.messages', 'm')
      .where({ confirmedAt: IsNull() })
      .andWhere({ deniedAt: IsNull() })
      .getMany()

    if (contributions.length === 0) {
      return []
    }

    const userIds = contributions.map((p) => p.userId)
    const userCreations = await getUserCreations(userIds, clientTimezoneOffset)
    const users = await DbUser.find({
      where: { id: In(userIds) },
      withDeleted: true,
      relations: ['emailContact'],
    })

    return contributions.map((contribution) => {
      const user = users.find((u) => u.id === contribution.userId)
      const creation = userCreations.find((c) => c.id === contribution.userId)

      return new UnconfirmedContribution(
        contribution,
        user,
        creation ? creation.creations : FULL_CREATION_AVAILABLE,
      )
    })
  }

  @Authorized([RIGHTS.ADMIN_DELETE_CONTRIBUTION])
  @Mutation(() => Boolean)
  async adminDeleteContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const contribution = await DbContribution.findOne(id)
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
    const user = await DbUser.findOneOrFail(
      { id: contribution.userId },
      { relations: ['emailContact'] },
    )
    contribution.contributionStatus = ContributionStatus.DELETED
    contribution.deletedBy = moderator.id
    await contribution.save()
    const res = await contribution.softRemove()

    const event = new Event()
    const eventAdminContributionDelete = new EventAdminContributionDelete()
    eventAdminContributionDelete.userId = contribution.userId
    eventAdminContributionDelete.amount = contribution.amount
    eventAdminContributionDelete.contributionId = contribution.id
    await writeEvent(event.setEventAdminContributionDelete(eventAdminContributionDelete))
    sendContributionDeletedEmail({
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
      const contribution = await DbContribution.findOne(id)
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
      const user = await DbUser.findOneOrFail(
        { id: contribution.userId },
        { withDeleted: true, relations: ['emailContact'] },
      )
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
        logger.info('creation commited successfuly.')
        sendContributionConfirmedEmail({
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

      const event = new Event()
      const eventContributionConfirm = new EventContributionConfirm()
      eventContributionConfirm.userId = user.id
      eventContributionConfirm.amount = contribution.amount
      eventContributionConfirm.contributionId = contribution.id
      await writeEvent(event.setEventContributionConfirm(eventContributionConfirm))
    } finally {
      releaseLock()
    }
    return true
  }

  @Authorized([RIGHTS.CREATION_TRANSACTION_LIST])
  @Query(() => ContributionListResult)
  async creationTransactionList(
    @Args()
    { currentPage = 1, pageSize = 25, order = Order.DESC }: Paginated,
    @Arg('userId', () => Int) userId: number,
  ): Promise<ContributionListResult> {
    const offset = (currentPage - 1) * pageSize
    const [contributionResult, count] = await getConnection()
      .createQueryBuilder()
      .select('c')
      .from(DbContribution, 'c')
      .leftJoinAndSelect('c.user', 'u')
      .where(`user_id = ${userId}`)
      .withDeleted()
      .limit(pageSize)
      .offset(offset)
      .orderBy('c.created_at', order)
      .getManyAndCount()

    return new ContributionListResult(
      count,
      contributionResult.map((contribution) => new Contribution(contribution, contribution.user)),
    )
    // return userTransactions.map((t) => new Transaction(t, new User(user), communityUser))
  }

  @Authorized([RIGHTS.OPEN_CREATIONS])
  @Query(() => [OpenCreation])
  async openCreations(
    @Arg('userId', () => Int, { nullable: true }) userId: number | null,
    @Ctx() context: Context,
  ): Promise<OpenCreation[]> {
    const id = userId || getUser(context).id
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const creationDates = getCreationDates(clientTimezoneOffset)
    const creations = await getUserCreation(id, clientTimezoneOffset)
    return creationDates.map((date, index) => {
      return {
        month: date.getMonth(),
        year: date.getFullYear(),
        amount: creations[index],
      }
    })
  }

  @Authorized([RIGHTS.DENY_CONTRIBUTION])
  @Mutation(() => Boolean)
  async denyContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const contributionToUpdate = await DbContribution.findOne({
      id,
      confirmedAt: IsNull(),
      deniedBy: IsNull(),
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
    const user = await DbUser.findOne(
      { id: contributionToUpdate.userId },
      { relations: ['emailContact'] },
    )
    if (!user) {
      throw new LogError('Could not find User of the Contribution', contributionToUpdate.userId)
    }

    contributionToUpdate.contributionStatus = ContributionStatus.DENIED
    contributionToUpdate.deniedBy = moderator.id
    contributionToUpdate.deniedAt = new Date()
    const res = await contributionToUpdate.save()

    const event = new Event()
    const eventAdminContributionDeny = new EventAdminContributionDeny()
    eventAdminContributionDeny.userId = moderator.id
    eventAdminContributionDeny.amount = contributionToUpdate.amount
    eventAdminContributionDeny.contributionId = contributionToUpdate.id
    await writeEvent(event.setEventAdminContributionDeny(eventAdminContributionDeny))

    sendContributionDeniedEmail({
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
