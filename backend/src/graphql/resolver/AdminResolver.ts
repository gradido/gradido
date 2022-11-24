import { Context, getUser, getClientTimezoneOffset } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { Resolver, Query, Arg, Args, Authorized, Mutation, Ctx, Int } from 'type-graphql'
import {
  getCustomRepository,
  IsNull,
  getConnection,
  In,
  MoreThan,
  FindOperator,
} from '@dbTools/typeorm'
import { UserAdmin, SearchUsersResult } from '@model/UserAdmin'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import { AdminCreateContributions } from '@model/AdminCreateContributions'
import { AdminUpdateContribution } from '@model/AdminUpdateContribution'
import { ContributionLink } from '@model/ContributionLink'
import { ContributionLinkList } from '@model/ContributionLinkList'
import { Contribution } from '@model/Contribution'
import { RIGHTS } from '@/auth/RIGHTS'
import { UserRepository } from '@repository/User'
import AdminCreateContributionArgs from '@arg/AdminCreateContributionArgs'
import AdminUpdateContributionArgs from '@arg/AdminUpdateContributionArgs'
import SearchUsersArgs from '@arg/SearchUsersArgs'
import ContributionLinkArgs from '@arg/ContributionLinkArgs'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { TransactionLink, TransactionLinkResult } from '@model/TransactionLink'
import { TransactionLink as dbTransactionLink } from '@entity/TransactionLink'
import { calculateDecay } from '@/util/decay'
import { Contribution as DbContribution } from '@entity/Contribution'
import { hasElopageBuys } from '@/util/hasElopageBuys'
import { User as dbUser } from '@entity/User'
import { User } from '@model/User'
import { TransactionTypeId } from '@enum/TransactionTypeId'
import { ContributionType } from '@enum/ContributionType'
import { ContributionStatus } from '@enum/ContributionStatus'
import Decimal from 'decimal.js-light'
import { Decay } from '@model/Decay'
import Paginated from '@arg/Paginated'
import TransactionLinkFilters from '@arg/TransactionLinkFilters'
import { Order } from '@enum/Order'
import { findUserByEmail, activationLink, printTimeDuration } from './UserResolver'
import { sendAccountActivationEmail } from '@/mailer/sendAccountActivationEmail'
import { transactionLinkCode as contributionLinkCode } from './TransactionLinkResolver'
import CONFIG from '@/config'
import {
  getUserCreation,
  getUserCreations,
  validateContribution,
  isStartEndDateValid,
  updateCreations,
  isValidDateString,
} from './util/creations'
import {
  CONTRIBUTIONLINK_NAME_MAX_CHARS,
  CONTRIBUTIONLINK_NAME_MIN_CHARS,
  FULL_CREATION_AVAILABLE,
  MEMO_MAX_CHARS,
  MEMO_MIN_CHARS,
} from './const/const'
import { UserContact } from '@entity/UserContact'
import { ContributionMessage as DbContributionMessage } from '@entity/ContributionMessage'
import ContributionMessageArgs from '@arg/ContributionMessageArgs'
import { ContributionMessageType } from '@enum/MessageType'
import { ContributionMessage } from '@model/ContributionMessage'
import { sendContributionConfirmedEmail } from '@/mailer/sendContributionConfirmedEmail'
import { sendContributionRejectedEmail } from '@/mailer/sendContributionRejectedEmail'
import { sendAddedContributionMessageEmail } from '@/mailer/sendAddedContributionMessageEmail'
import { eventProtocol } from '@/event/EventProtocolEmitter'
import {
  Event,
  EventAdminContributionCreate,
  EventAdminContributionDelete,
  EventAdminContributionUpdate,
  EventContributionConfirm,
  EventSendConfirmationEmail,
} from '@/event/Event'
import { ContributionListResult } from '../model/Contribution'

// const EMAIL_OPT_IN_REGISTER = 1
// const EMAIL_OPT_UNKNOWN = 3 // elopage?

@Resolver()
export class AdminResolver {
  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => SearchUsersResult)
  async searchUsers(
    @Args()
    { searchText, currentPage = 1, pageSize = 25, filters }: SearchUsersArgs,
    @Ctx() context: Context,
  ): Promise<SearchUsersResult> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const userRepository = getCustomRepository(UserRepository)
    const userFields = [
      'id',
      'firstName',
      'lastName',
      'emailId',
      'emailContact',
      'deletedAt',
      'isAdmin',
    ]
    const [users, count] = await userRepository.findBySearchCriteriaPagedFiltered(
      userFields.map((fieldName) => {
        return 'user.' + fieldName
      }),
      searchText,
      filters,
      currentPage,
      pageSize,
    )

    if (users.length === 0) {
      return {
        userCount: 0,
        userList: [],
      }
    }

    const creations = await getUserCreations(
      users.map((u) => u.id),
      clientTimezoneOffset,
    )

    const adminUsers = await Promise.all(
      users.map(async (user) => {
        let emailConfirmationSend = ''
        if (!user.emailContact.emailChecked) {
          if (user.emailContact.updatedAt) {
            emailConfirmationSend = user.emailContact.updatedAt.toISOString()
          } else {
            emailConfirmationSend = user.emailContact.createdAt.toISOString()
          }
        }
        const userCreations = creations.find((c) => c.id === user.id)
        const adminUser = new UserAdmin(
          user,
          userCreations ? userCreations.creations : FULL_CREATION_AVAILABLE,
          await hasElopageBuys(user.emailContact.email),
          emailConfirmationSend,
        )
        return adminUser
      }),
    )
    return {
      userCount: count,
      userList: adminUsers,
    }
  }

  @Authorized([RIGHTS.SET_USER_ROLE])
  @Mutation(() => Date, { nullable: true })
  async setUserRole(
    @Arg('userId', () => Int)
    userId: number,
    @Arg('isAdmin', () => Boolean)
    isAdmin: boolean,
    @Ctx()
    context: Context,
  ): Promise<Date | null> {
    const user = await dbUser.findOne({ id: userId })
    // user exists ?
    if (!user) {
      logger.error(`Could not find user with userId: ${userId}`)
      throw new Error(`Could not find user with userId: ${userId}`)
    }
    // administrator user changes own role?
    const moderatorUser = getUser(context)
    if (moderatorUser.id === userId) {
      logger.error('Administrator can not change his own role!')
      throw new Error('Administrator can not change his own role!')
    }
    // change isAdmin
    switch (user.isAdmin) {
      case null:
        if (isAdmin === true) {
          user.isAdmin = new Date()
        } else {
          logger.error('User is already a usual user!')
          throw new Error('User is already a usual user!')
        }
        break
      default:
        if (isAdmin === false) {
          user.isAdmin = null
        } else {
          logger.error('User is already admin!')
          throw new Error('User is already admin!')
        }
        break
    }
    await user.save()
    const newUser = await dbUser.findOne({ id: userId })
    return newUser ? newUser.isAdmin : null
  }

  @Authorized([RIGHTS.DELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async deleteUser(
    @Arg('userId', () => Int) userId: number,
    @Ctx() context: Context,
  ): Promise<Date | null> {
    const user = await dbUser.findOne({ id: userId })
    // user exists ?
    if (!user) {
      logger.error(`Could not find user with userId: ${userId}`)
      throw new Error(`Could not find user with userId: ${userId}`)
    }
    // moderator user disabled own account?
    const moderatorUser = getUser(context)
    if (moderatorUser.id === userId) {
      logger.error('Moderator can not delete his own account!')
      throw new Error('Moderator can not delete his own account!')
    }
    // soft-delete user
    await user.softRemove()
    const newUser = await dbUser.findOne({ id: userId }, { withDeleted: true })
    return newUser ? newUser.deletedAt : null
  }

  @Authorized([RIGHTS.UNDELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async unDeleteUser(@Arg('userId', () => Int) userId: number): Promise<Date | null> {
    const user = await dbUser.findOne({ id: userId }, { withDeleted: true })
    if (!user) {
      logger.error(`Could not find user with userId: ${userId}`)
      throw new Error(`Could not find user with userId: ${userId}`)
    }
    if (!user.deletedAt) {
      logger.error('User is not deleted')
      throw new Error('User is not deleted')
    }
    await user.recover()
    return null
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
      logger.error(`invalid Date for creationDate=${creationDate}`)
      throw new Error(`invalid Date for creationDate=${creationDate}`)
    }
    const emailContact = await UserContact.findOne({
      where: { email },
      withDeleted: true,
      relations: ['user'],
    })
    if (!emailContact) {
      logger.error(`Could not find user with email: ${email}`)
      throw new Error(`Could not find user with email: ${email}`)
    }
    if (emailContact.deletedAt) {
      logger.error('This emailContact was deleted. Cannot create a contribution.')
      throw new Error('This emailContact was deleted. Cannot create a contribution.')
    }
    if (emailContact.user.deletedAt) {
      logger.error('This user was deleted. Cannot create a contribution.')
      throw new Error('This user was deleted. Cannot create a contribution.')
    }
    if (!emailContact.emailChecked) {
      logger.error('Contribution could not be saved, Email is not activated')
      throw new Error('Contribution could not be saved, Email is not activated')
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
    await eventProtocol.writeEvent(
      event.setEventAdminContributionCreate(eventAdminCreateContribution),
    )

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
    if (!emailContact) {
      logger.error(`Could not find UserContact with email: ${email}`)
      throw new Error(`Could not find UserContact with email: ${email}`)
    }
    const user = emailContact.user
    if (!user) {
      logger.error(`Could not find User to emailContact: ${email}`)
      throw new Error(`Could not find User to emailContact: ${email}`)
    }
    if (user.deletedAt) {
      logger.error(`User was deleted (${email})`)
      throw new Error(`User was deleted (${email})`)
    }

    const moderator = getUser(context)

    const contributionToUpdate = await DbContribution.findOne({
      where: { id, confirmedAt: IsNull() },
    })
    if (!contributionToUpdate) {
      logger.error('No contribution found to given id.')
      throw new Error('No contribution found to given id.')
    }

    if (contributionToUpdate.userId !== user.id) {
      logger.error('user of the pending contribution and send user does not correspond')
      throw new Error('user of the pending contribution and send user does not correspond')
    }

    if (contributionToUpdate.moderatorId === null) {
      logger.error('An admin is not allowed to update a user contribution.')
      throw new Error('An admin is not allowed to update a user contribution.')
    }

    const creationDateObj = new Date(creationDate)
    let creations = await getUserCreation(user.id, clientTimezoneOffset)

    if (contributionToUpdate.contributionDate.getMonth() === creationDateObj.getMonth()) {
      creations = updateCreations(creations, contributionToUpdate, clientTimezoneOffset)
    } else {
      logger.error('Currently the month of the contribution cannot change.')
      throw new Error('Currently the month of the contribution cannot change.')
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

    result.creation = await getUserCreation(user.id, clientTimezoneOffset)

    const event = new Event()
    const eventAdminContributionUpdate = new EventAdminContributionUpdate()
    eventAdminContributionUpdate.userId = user.id
    eventAdminContributionUpdate.amount = amount
    eventAdminContributionUpdate.contributionId = contributionToUpdate.id
    await eventProtocol.writeEvent(
      event.setEventAdminContributionUpdate(eventAdminContributionUpdate),
    )

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
      .getMany()

    if (contributions.length === 0) {
      return []
    }

    const userIds = contributions.map((p) => p.userId)
    const userCreations = await getUserCreations(userIds, clientTimezoneOffset)
    const users = await dbUser.find({
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
      logger.error(`Contribution not found for given id: ${id}`)
      throw new Error('Contribution not found for given id.')
    }
    const moderator = getUser(context)
    if (
      contribution.contributionType === ContributionType.USER &&
      contribution.userId === moderator.id
    ) {
      throw new Error('Own contribution can not be deleted as admin')
    }
    const user = await dbUser.findOneOrFail(
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
    await eventProtocol.writeEvent(
      event.setEventAdminContributionDelete(eventAdminContributionDelete),
    )
    sendContributionRejectedEmail({
      senderFirstName: moderator.firstName,
      senderLastName: moderator.lastName,
      recipientEmail: user.emailContact.email,
      recipientFirstName: user.firstName,
      recipientLastName: user.lastName,
      contributionMemo: contribution.memo,
      contributionAmount: contribution.amount,
      overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
    })

    return !!res
  }

  @Authorized([RIGHTS.CONFIRM_CONTRIBUTION])
  @Mutation(() => Boolean)
  async confirmContribution(
    @Arg('id', () => Int) id: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const contribution = await DbContribution.findOne(id)
    if (!contribution) {
      logger.error(`Contribution not found for given id: ${id}`)
      throw new Error('Contribution not found to given id.')
    }
    const moderatorUser = getUser(context)
    if (moderatorUser.id === contribution.userId) {
      logger.error('Moderator can not confirm own contribution')
      throw new Error('Moderator can not confirm own contribution')
    }
    const user = await dbUser.findOneOrFail(
      { id: contribution.userId },
      { withDeleted: true, relations: ['emailContact'] },
    )
    if (user.deletedAt) {
      logger.error('This user was deleted. Cannot confirm a contribution.')
      throw new Error('This user was deleted. Cannot confirm a contribution.')
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
    try {
      const lastTransaction = await queryRunner.manager
        .createQueryBuilder()
        .select('transaction')
        .from(DbTransaction, 'transaction')
        .where('transaction.userId = :id', { id: contribution.userId })
        .orderBy('transaction.balanceDate', 'DESC')
        .getOne()
      logger.info('lastTransaction ID', lastTransaction ? lastTransaction.id : 'undefined')

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
        senderFirstName: moderatorUser.firstName,
        senderLastName: moderatorUser.lastName,
        recipientFirstName: user.firstName,
        recipientLastName: user.lastName,
        recipientEmail: user.emailContact.email,
        contributionMemo: contribution.memo,
        contributionAmount: contribution.amount,
        overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
      })
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error(`Creation was not successful: ${e}`)
      throw new Error(`Creation was not successful.`)
    } finally {
      await queryRunner.release()
    }

    const event = new Event()
    const eventContributionConfirm = new EventContributionConfirm()
    eventContributionConfirm.userId = user.id
    eventContributionConfirm.amount = contribution.amount
    eventContributionConfirm.contributionId = contribution.id
    await eventProtocol.writeEvent(event.setEventContributionConfirm(eventContributionConfirm))
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

  @Authorized([RIGHTS.SEND_ACTIVATION_EMAIL])
  @Mutation(() => Boolean)
  async sendActivationEmail(@Arg('email') email: string): Promise<boolean> {
    email = email.trim().toLowerCase()
    // const user = await dbUser.findOne({ id: emailContact.userId })
    const user = await findUserByEmail(email)
    if (!user) {
      logger.error(`Could not find User to emailContact: ${email}`)
      throw new Error(`Could not find User to emailContact: ${email}`)
    }
    if (user.deletedAt) {
      logger.error(`User with emailContact: ${email} is deleted.`)
      throw new Error(`User with emailContact: ${email} is deleted.`)
    }
    const emailContact = user.emailContact
    if (emailContact.deletedAt) {
      logger.error(`The emailContact: ${email} of htis User is deleted.`)
      throw new Error(`The emailContact: ${email} of htis User is deleted.`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const emailSent = await sendAccountActivationEmail({
      link: activationLink(emailContact.emailVerificationCode),
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      duration: printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    // In case EMails are disabled log the activation link for the user
    if (!emailSent) {
      logger.info(`Account confirmation link: ${activationLink}`)
    } else {
      const event = new Event()
      const eventSendConfirmationEmail = new EventSendConfirmationEmail()
      eventSendConfirmationEmail.userId = user.id
      await eventProtocol.writeEvent(
        event.setEventSendConfirmationEmail(eventSendConfirmationEmail),
      )
    }

    return true
  }

  @Authorized([RIGHTS.LIST_TRANSACTION_LINKS_ADMIN])
  @Query(() => TransactionLinkResult)
  async listTransactionLinksAdmin(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Arg('filters', () => TransactionLinkFilters, { nullable: true })
    filters: TransactionLinkFilters,
    @Arg('userId', () => Int)
    userId: number,
  ): Promise<TransactionLinkResult> {
    const user = await dbUser.findOneOrFail({ id: userId })
    const where: {
      userId: number
      redeemedBy?: number | null
      validUntil?: FindOperator<Date> | null
    } = {
      userId,
      redeemedBy: null,
      validUntil: MoreThan(new Date()),
    }
    if (filters) {
      if (filters.withRedeemed) delete where.redeemedBy
      if (filters.withExpired) delete where.validUntil
    }
    const [transactionLinks, count] = await dbTransactionLink.findAndCount({
      where,
      withDeleted: filters ? filters.withDeleted : false,
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })

    return {
      linkCount: count,
      linkList: transactionLinks.map((tl) => new TransactionLink(tl, new User(user))),
    }
  }

  @Authorized([RIGHTS.CREATE_CONTRIBUTION_LINK])
  @Mutation(() => ContributionLink)
  async createContributionLink(
    @Args()
    {
      amount,
      name,
      memo,
      cycle,
      validFrom,
      validTo,
      maxAmountPerMonth,
      maxPerCycle,
    }: ContributionLinkArgs,
  ): Promise<ContributionLink> {
    isStartEndDateValid(validFrom, validTo)
    if (!name) {
      logger.error(`The name must be initialized!`)
      throw new Error(`The name must be initialized!`)
    }
    if (
      name.length < CONTRIBUTIONLINK_NAME_MIN_CHARS ||
      name.length > CONTRIBUTIONLINK_NAME_MAX_CHARS
    ) {
      const msg = `The value of 'name' with a length of ${name.length} did not fulfill the requested bounderies min=${CONTRIBUTIONLINK_NAME_MIN_CHARS} and max=${CONTRIBUTIONLINK_NAME_MAX_CHARS}`
      logger.error(`${msg}`)
      throw new Error(`${msg}`)
    }
    if (!memo) {
      logger.error(`The memo must be initialized!`)
      throw new Error(`The memo must be initialized!`)
    }
    if (memo.length < MEMO_MIN_CHARS || memo.length > MEMO_MAX_CHARS) {
      const msg = `The value of 'memo' with a length of ${memo.length} did not fulfill the requested bounderies min=${MEMO_MIN_CHARS} and max=${MEMO_MAX_CHARS}`
      logger.error(`${msg}`)
      throw new Error(`${msg}`)
    }
    if (!amount) {
      logger.error(`The amount must be initialized!`)
      throw new Error('The amount must be initialized!')
    }
    if (!new Decimal(amount).isPositive()) {
      logger.error(`The amount=${amount} must be initialized with a positiv value!`)
      throw new Error(`The amount=${amount} must be initialized with a positiv value!`)
    }
    const dbContributionLink = new DbContributionLink()
    dbContributionLink.amount = amount
    dbContributionLink.name = name
    dbContributionLink.memo = memo
    dbContributionLink.createdAt = new Date()
    dbContributionLink.code = contributionLinkCode(dbContributionLink.createdAt)
    dbContributionLink.cycle = cycle
    if (validFrom) dbContributionLink.validFrom = new Date(validFrom)
    if (validTo) dbContributionLink.validTo = new Date(validTo)
    dbContributionLink.maxAmountPerMonth = maxAmountPerMonth
    dbContributionLink.maxPerCycle = maxPerCycle
    await dbContributionLink.save()
    logger.debug(`createContributionLink successful!`)
    return new ContributionLink(dbContributionLink)
  }

  @Authorized([RIGHTS.LIST_CONTRIBUTION_LINKS])
  @Query(() => ContributionLinkList)
  async listContributionLinks(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
  ): Promise<ContributionLinkList> {
    const [links, count] = await DbContributionLink.findAndCount({
      where: [{ validTo: MoreThan(new Date()) }, { validTo: IsNull() }],
      order: { createdAt: order },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })
    return {
      links: links.map((link: DbContributionLink) => new ContributionLink(link)),
      count,
    }
  }

  @Authorized([RIGHTS.DELETE_CONTRIBUTION_LINK])
  @Mutation(() => Date, { nullable: true })
  async deleteContributionLink(@Arg('id', () => Int) id: number): Promise<Date | null> {
    const contributionLink = await DbContributionLink.findOne(id)
    if (!contributionLink) {
      logger.error(`Contribution Link not found to given id: ${id}`)
      throw new Error('Contribution Link not found to given id.')
    }
    await contributionLink.softRemove()
    logger.debug(`deleteContributionLink successful!`)
    const newContributionLink = await DbContributionLink.findOne({ id }, { withDeleted: true })
    return newContributionLink ? newContributionLink.deletedAt : null
  }

  @Authorized([RIGHTS.UPDATE_CONTRIBUTION_LINK])
  @Mutation(() => ContributionLink)
  async updateContributionLink(
    @Args()
    {
      amount,
      name,
      memo,
      cycle,
      validFrom,
      validTo,
      maxAmountPerMonth,
      maxPerCycle,
    }: ContributionLinkArgs,
    @Arg('id', () => Int) id: number,
  ): Promise<ContributionLink> {
    const dbContributionLink = await DbContributionLink.findOne(id)
    if (!dbContributionLink) {
      logger.error(`Contribution Link not found to given id: ${id}`)
      throw new Error('Contribution Link not found to given id.')
    }
    dbContributionLink.amount = amount
    dbContributionLink.name = name
    dbContributionLink.memo = memo
    dbContributionLink.cycle = cycle
    if (validFrom) dbContributionLink.validFrom = new Date(validFrom)
    if (validTo) dbContributionLink.validTo = new Date(validTo)
    dbContributionLink.maxAmountPerMonth = maxAmountPerMonth
    dbContributionLink.maxPerCycle = maxPerCycle
    await dbContributionLink.save()
    logger.debug(`updateContributionLink successful!`)
    return new ContributionLink(dbContributionLink)
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
        senderFirstName: user.firstName,
        senderLastName: user.lastName,
        recipientFirstName: contribution.user.firstName,
        recipientLastName: contribution.user.lastName,
        recipientEmail: contribution.user.emailContact.email,
        senderEmail: user.emailContact.email,
        contributionMemo: contribution.memo,
        message,
        overviewURL: CONFIG.EMAIL_LINK_OVERVIEW,
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
