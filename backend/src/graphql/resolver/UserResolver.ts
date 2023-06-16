/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { getConnection, getCustomRepository, IsNull, Not } from '@dbTools/typeorm'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import i18n from 'i18n'
import { Resolver, Query, Args, Arg, Authorized, Ctx, Mutation, Int } from 'type-graphql'
import { v4 as uuidv4 } from 'uuid'

import { CreateUserArgs } from '@arg/CreateUserArgs'
import { Paginated } from '@arg/Paginated'
import { SearchUsersFilters } from '@arg/SearchUsersFilters'
import { UnsecureLoginArgs } from '@arg/UnsecureLoginArgs'
import { UpdateUserInfosArgs } from '@arg/UpdateUserInfosArgs'
import { OptInType } from '@enum/OptInType'
import { Order } from '@enum/Order'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { UserContactType } from '@enum/UserContactType'
import { SearchAdminUsersResult } from '@model/AdminUser'
import { User } from '@model/User'
import { UserAdmin, SearchUsersResult } from '@model/UserAdmin'
import { UserRepository } from '@repository/User'

import { subscribe } from '@/apis/KlicktippController'
import { encode } from '@/auth/JWT'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import {
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendResetPasswordEmail,
} from '@/emails/sendEmailVariants'
import {
  Event,
  EventType,
  EVENT_USER_LOGIN,
  EVENT_EMAIL_ACCOUNT_MULTIREGISTRATION,
  EVENT_EMAIL_CONFIRMATION,
  EVENT_USER_REGISTER,
  EVENT_USER_ACTIVATE_ACCOUNT,
  EVENT_EMAIL_ADMIN_CONFIRMATION,
  EVENT_USER_LOGOUT,
  EVENT_EMAIL_FORGOT_PASSWORD,
  EVENT_USER_INFO_UPDATE,
  EVENT_ADMIN_USER_ROLE_SET,
  EVENT_ADMIN_USER_DELETE,
  EVENT_ADMIN_USER_UNDELETE,
} from '@/event/Events'
import { isValidPassword } from '@/password/EncryptorUtils'
import { encryptPassword, verifyPassword } from '@/password/PasswordEncryptor'
import { Context, getUser, getClientTimezoneOffset } from '@/server/context'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { communityDbUser } from '@/util/communityUser'
import { hasElopageBuys } from '@/util/hasElopageBuys'
import { getTimeDurationObject, printTimeDuration } from '@/util/time'

import random from 'random-bigint'
import { randombytes_random } from 'sodium-native'

import { FULL_CREATION_AVAILABLE } from './const/const'
import { getUserCreations } from './util/creations'
import { findUserByIdentifier } from './util/findUserByIdentifier'
import { getKlicktippState } from './util/getKlicktippState'
import { validateAlias } from './util/validateAlias'

const LANGUAGES = ['de', 'en', 'es', 'fr', 'nl']
const DEFAULT_LANGUAGE = 'de'
const isLanguage = (language: string): boolean => {
  return LANGUAGES.includes(language)
}

const newEmailContact = (email: string, userId: number): DbUserContact => {
  logger.trace(`newEmailContact...`)
  const emailContact = new DbUserContact()
  emailContact.email = email
  emailContact.userId = userId
  emailContact.type = UserContactType.USER_CONTACT_EMAIL
  emailContact.emailChecked = false
  emailContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
  emailContact.emailVerificationCode = random(64)
  logger.debug('newEmailContact...successful', emailContact)
  return emailContact
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const activationLink = (verificationCode: BigInt): string => {
  logger.debug(`activationLink(${verificationCode})...`)
  return CONFIG.EMAIL_LINK_SETPASSWORD.replace(/{optin}/g, verificationCode.toString())
}

const newGradidoID = async (): Promise<string> => {
  let gradidoId: string
  let countIds: number
  do {
    gradidoId = uuidv4()
    countIds = await DbUser.count({ where: { gradidoID: gradidoId } })
    if (countIds > 0) {
      logger.info('Gradido-ID creation conflict...')
    }
  } while (countIds > 0)
  return gradidoId
}

@Resolver()
export class UserResolver {
  @Authorized([RIGHTS.VERIFY_LOGIN])
  @Query(() => User)
  async verifyLogin(@Ctx() context: Context): Promise<User> {
    logger.info('verifyLogin...')
    // TODO refactor and do not have duplicate code with login(see below)
    const userEntity = getUser(context)
    const user = new User(userEntity)
    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage(context)

    logger.debug(`verifyLogin... successful: ${user.firstName}.${user.lastName}`)
    user.klickTipp = await getKlicktippState(userEntity.emailContact.email)
    return user
  }

  @Authorized([RIGHTS.LOGIN])
  @Mutation(() => User)
  async login(
    @Args() { email, password, publisherId }: UnsecureLoginArgs,
    @Ctx() context: Context,
  ): Promise<User> {
    logger.info(`login with ${email}, ***, ${publisherId} ...`)
    email = email.trim().toLowerCase()
    const dbUser = await findUserByEmail(email)
    if (dbUser.deletedAt) {
      throw new LogError('This user was permanently deleted. Contact support for questions', dbUser)
    }
    if (!dbUser.emailContact.emailChecked) {
      throw new LogError('The Users email is not validate yet', dbUser)
    }
    // TODO: at least in test this does not work since `dbUser.password = 0` and `BigInto(0) = 0n`
    if (dbUser.password === BigInt(0)) {
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      throw new LogError('The User has not set a password yet', dbUser)
    }

    if (!verifyPassword(dbUser, password)) {
      throw new LogError('No user with this credentials', dbUser)
    }

    if (dbUser.passwordEncryptionType !== PasswordEncryptionType.GRADIDO_ID) {
      dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      dbUser.password = encryptPassword(dbUser, password)
      await dbUser.save()
    }
    // add pubKey in logger-context for layout-pattern X{user} to print it in each logging message
    logger.addContext('user', dbUser.id)
    logger.debug('validation of login credentials successful...')

    const user = new User(dbUser)
    logger.debug(`user= ${JSON.stringify(user, null, 2)}`)

    i18n.setLocale(user.language)

    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage({ ...context, user: dbUser })
    logger.info('user.hasElopage', user.hasElopage)
    if (!user.hasElopage && publisherId) {
      user.publisherId = publisherId
      dbUser.publisherId = publisherId
      await DbUser.save(dbUser)
    }
    user.klickTipp = await getKlicktippState(dbUser.emailContact.email)

    context.setHeaders.push({
      key: 'token',
      value: await encode(dbUser.gradidoID),
    })

    await EVENT_USER_LOGIN(dbUser)
    logger.info(`successful Login: ${JSON.stringify(user, null, 2)}`)
    return user
  }

  @Authorized([RIGHTS.LOGOUT])
  @Mutation(() => Boolean)
  async logout(@Ctx() context: Context): Promise<boolean> {
    await EVENT_USER_LOGOUT(getUser(context))
    // remove user from logger context
    logger.addContext('user', 'unknown')
    return true
  }

  @Authorized([RIGHTS.CREATE_USER])
  @Mutation(() => User)
  async createUser(
    @Args()
    { email, firstName, lastName, language, publisherId = null, redeemCode = null }: CreateUserArgs,
  ): Promise<User> {
    logger.addContext('user', 'unknown')
    logger.info(
      `createUser(email=${email}, firstName=${firstName}, lastName=${lastName}, language=${language}, publisherId=${publisherId}, redeemCode =${redeemCode})`,
    )
    // TODO: wrong default value (should be null), how does graphql work here? Is it an required field?
    // default int publisher_id = 0;

    // Validate Language (no throw)
    if (!language || !isLanguage(language)) {
      language = DEFAULT_LANGUAGE
    }
    i18n.setLocale(language)

    // check if user with email still exists?
    email = email.trim().toLowerCase()
    if (await checkEmailExists(email)) {
      const foundUser = await findUserByEmail(email)
      logger.info('DbUser.findOne', email, foundUser)

      if (foundUser) {
        // ATTENTION: this logger-message will be exactly expected during tests, next line
        logger.info(`User already exists with this email=${email}`)
        logger.info(
          `Specified username when trying to register multiple times with this email: firstName=${firstName}, lastName=${lastName}`,
        )
        // TODO: this is unsecure, but the current implementation of the login server. This way it can be queried if the user with given EMail is existent.

        const user = new User(communityDbUser)
        user.id = randombytes_random() % (2048 * 16) // TODO: for a better faking derive id from email so that it will be always the same id when the same email comes in?
        user.gradidoID = uuidv4()
        user.firstName = firstName
        user.lastName = lastName
        user.language = language
        user.publisherId = publisherId
        logger.debug('partly faked user', user)

        void sendAccountMultiRegistrationEmail({
          firstName: foundUser.firstName, // this is the real name of the email owner, but just "firstName" would be the name of the new registrant which shall not be passed to the outside
          lastName: foundUser.lastName, // this is the real name of the email owner, but just "lastName" would be the name of the new registrant which shall not be passed to the outside
          email,
          language: foundUser.language, // use language of the emails owner for sending
        })
        await EVENT_EMAIL_ACCOUNT_MULTIREGISTRATION(foundUser)

        logger.info(
          `sendAccountMultiRegistrationEmail by ${firstName} ${lastName} to ${foundUser.firstName} ${foundUser.lastName} <${email}>`,
        )
        /* uncomment this, when you need the activation link on the console */
        // In case EMails are disabled log the activation link for the user
        logger.info('createUser() faked and send multi registration mail...')

        return user
      }
    }

    const gradidoID = await newGradidoID()

    const eventRegisterRedeem = Event(
      EventType.USER_REGISTER_REDEEM,
      { id: 0 } as DbUser,
      { id: 0 } as DbUser,
    )
    let dbUser = new DbUser()
    dbUser.gradidoID = gradidoID
    dbUser.firstName = firstName
    dbUser.lastName = lastName
    dbUser.language = language
    dbUser.publisherId = publisherId ?? 0
    dbUser.passwordEncryptionType = PasswordEncryptionType.NO_PASSWORD
    logger.debug('new dbUser', dbUser)
    if (redeemCode) {
      if (redeemCode.match(/^CL-/)) {
        const contributionLink = await DbContributionLink.findOne({
          code: redeemCode.replace('CL-', ''),
        })
        logger.info('redeemCode found contributionLink', contributionLink)
        if (contributionLink) {
          dbUser.contributionLinkId = contributionLink.id
          eventRegisterRedeem.involvedContributionLink = contributionLink
        }
      } else {
        const transactionLink = await DbTransactionLink.findOne({ code: redeemCode })
        logger.info('redeemCode found transactionLink', transactionLink)
        if (transactionLink) {
          dbUser.referrerId = transactionLink.userId
          eventRegisterRedeem.involvedTransactionLink = transactionLink
        }
      }
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    try {
      dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
        throw new LogError('Error while saving dbUser', error)
      })
      let emailContact = newEmailContact(email, dbUser.id)
      emailContact = await queryRunner.manager.save(emailContact).catch((error) => {
        throw new LogError('Error while saving user email contact', error)
      })

      dbUser.emailContact = emailContact
      dbUser.emailId = emailContact.id
      await queryRunner.manager.save(dbUser).catch((error) => {
        throw new LogError('Error while updating dbUser', error)
      })

      const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
        /{optin}/g,
        emailContact.emailVerificationCode.toString(),
      ).replace(/{code}/g, redeemCode ? '/' + redeemCode : '')

      void sendAccountActivationEmail({
        firstName,
        lastName,
        email,
        language,
        activationLink,
        timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
      })
      logger.info(`sendAccountActivationEmail of ${firstName}.${lastName} to ${email}`)

      await EVENT_EMAIL_CONFIRMATION(dbUser)

      await queryRunner.commitTransaction()
      logger.addContext('user', dbUser.id)
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError('Error creating user', e)
    } finally {
      await queryRunner.release()
    }
    logger.info('createUser() successful...')

    if (redeemCode) {
      eventRegisterRedeem.affectedUser = dbUser
      eventRegisterRedeem.actingUser = dbUser
      await eventRegisterRedeem.save()
    } else {
      await EVENT_USER_REGISTER(dbUser)
    }

    return new User(dbUser)
  }

  @Authorized([RIGHTS.SEND_RESET_PASSWORD_EMAIL])
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string): Promise<boolean> {
    logger.addContext('user', 'unknown')
    logger.info(`forgotPassword(${email})...`)
    email = email.trim().toLowerCase()
    const user = await findUserByEmail(email).catch(() => {
      logger.warn(`fail on find UserContact per ${email}`)
    })
    if (!user) {
      logger.warn(`no user found with ${email}`)
      return true
    }

    if (!canEmailResend(user.emailContact.updatedAt || user.emailContact.createdAt)) {
      throw new LogError(
        `Email already sent less than ${printTimeDuration(CONFIG.EMAIL_CODE_REQUEST_TIME)} ago`,
      )
    }

    user.emailContact.updatedAt = new Date()
    user.emailContact.emailResendCount++
    user.emailContact.emailVerificationCode = random(64)
    user.emailContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_RESET_PASSWORD
    await user.emailContact.save().catch(() => {
      throw new LogError('Unable to save email verification code', user.emailContact)
    })

    logger.info('optInCode for', email, user.emailContact)

    void sendResetPasswordEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      language: user.language,
      resetLink: activationLink(user.emailContact.emailVerificationCode),
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    logger.info(`forgotPassword(${email}) successful...`)
    await EVENT_EMAIL_FORGOT_PASSWORD(user)

    return true
  }

  @Authorized([RIGHTS.SET_PASSWORD])
  @Mutation(() => Boolean)
  async setPassword(
    @Arg('code') code: string,
    @Arg('password') password: string,
  ): Promise<boolean> {
    logger.info(`setPassword(${code}, ***)...`)
    // Validate Password
    if (!isValidPassword(password)) {
      throw new LogError(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }

    // load code
    const userContact = await DbUserContact.findOneOrFail(
      { emailVerificationCode: code },
      { relations: ['user'] },
    ).catch(() => {
      throw new LogError('Could not login with emailVerificationCode')
    })
    logger.debug('userContact loaded...')
    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isEmailVerificationCodeValid(userContact.updatedAt || userContact.createdAt)) {
      throw new LogError(
        `Email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }
    logger.debug('EmailVerificationCode is valid...')

    // load user
    const user = userContact.user
    logger.debug('user with EmailVerificationCode found...')

    // Activate EMail
    userContact.emailChecked = true

    // Update Password
    user.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
    user.password = encryptPassword(user, password)
    logger.debug('User credentials updated ...')

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')

    try {
      // Save user
      await queryRunner.manager.save(user).catch((error) => {
        throw new LogError('Error saving user', error)
      })
      // Save userContact
      await queryRunner.manager.save(userContact).catch((error) => {
        throw new LogError('Error saving userContact', error)
      })

      await queryRunner.commitTransaction()
      logger.info('User and UserContact data written successfully...')
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError('Error on writing User and User Contact data', e)
    } finally {
      await queryRunner.release()
    }

    // Sign into Klicktipp
    // TODO do we always signUp the user? How to handle things with old users?
    if (userContact.emailOptInTypeId === OptInType.EMAIL_OPT_IN_REGISTER) {
      try {
        await subscribe(userContact.email, user.language, user.firstName, user.lastName)
        logger.debug(
          `subscribe(${userContact.email}, ${user.language}, ${user.firstName}, ${user.lastName})`,
        )
      } catch (e) {
        logger.error('Error subscribing to klicktipp', e)
      }
    }
    await EVENT_USER_ACTIVATE_ACCOUNT(user)

    return true
  }

  @Authorized([RIGHTS.QUERY_OPT_IN])
  @Query(() => Boolean)
  async queryOptIn(@Arg('optIn') optIn: string): Promise<boolean> {
    logger.info(`queryOptIn(${optIn})...`)
    const userContact = await DbUserContact.findOneOrFail({ emailVerificationCode: optIn })
    logger.debug('found optInCode', userContact)
    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isEmailVerificationCodeValid(userContact.updatedAt || userContact.createdAt)) {
      throw new LogError(
        `Email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }
    logger.info(`queryOptIn(${optIn}) successful...`)
    return true
  }

  @Authorized([RIGHTS.CHECK_USERNAME])
  @Query(() => Boolean)
  async checkUsername(@Arg('username') username: string): Promise<boolean> {
    try {
      await validateAlias(username)
      return true
    } catch {
      return false
    }
  }

  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async updateUserInfos(
    @Args()
    {
      firstName,
      lastName,
      alias,
      language,
      password,
      passwordNew,
      hideAmountGDD,
      hideAmountGDT,
    }: UpdateUserInfosArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    logger.info(`updateUserInfos(${firstName}, ${lastName}, ${language}, ***, ***)...`)
    const user = getUser(context)

    if (firstName) {
      user.firstName = firstName
    }

    if (lastName) {
      user.lastName = lastName
    }

    if (alias && (await validateAlias(alias))) {
      user.alias = alias
    }

    if (language) {
      if (!isLanguage(language)) {
        throw new LogError('Given language is not a valid language', language)
      }
      user.language = language
      i18n.setLocale(language)
    }

    if (password && passwordNew) {
      // Validate Password
      if (!isValidPassword(passwordNew)) {
        throw new LogError(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
        )
      }

      if (!verifyPassword(user, password)) {
        throw new LogError(`Old password is invalid`)
      }

      // Save new password hash and newly encrypted private key
      user.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      user.password = encryptPassword(user, passwordNew)
    }

    // Save hideAmountGDD value
    if (hideAmountGDD !== undefined) {
      user.hideAmountGDD = hideAmountGDD
    }
    // Save hideAmountGDT value
    if (hideAmountGDT !== undefined) {
      user.hideAmountGDT = hideAmountGDT
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')

    try {
      await queryRunner.manager.save(user).catch((error) => {
        throw new LogError('Error saving user', error)
      })

      await queryRunner.commitTransaction()
      logger.debug('writing User data successful...')
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError('Error on writing updated user data', e)
    } finally {
      await queryRunner.release()
    }
    logger.info('updateUserInfos() successfully finished...')
    await EVENT_USER_INFO_UPDATE(user)

    return true
  }

  @Authorized([RIGHTS.HAS_ELOPAGE])
  @Query(() => Boolean)
  async hasElopage(@Ctx() context: Context): Promise<boolean> {
    logger.info(`hasElopage()...`)
    const userEntity = getUser(context)
    const elopageBuys = hasElopageBuys(userEntity.emailContact.email)
    logger.debug('has ElopageBuys', elopageBuys)
    return elopageBuys
  }

  @Authorized([RIGHTS.SEARCH_ADMIN_USERS])
  @Query(() => SearchAdminUsersResult)
  async searchAdminUsers(
    @Args()
    { currentPage = 1, pageSize = 25, order = Order.DESC }: Paginated,
  ): Promise<SearchAdminUsersResult> {
    const userRepository = getCustomRepository(UserRepository)

    const [users, count] = await userRepository.findAndCount({
      where: {
        isAdmin: Not(IsNull()),
      },
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })

    return {
      userCount: count,
      userList: users.map((user) => {
        return {
          firstName: user.firstName,
          lastName: user.lastName,
        }
      }),
    }
  }

  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => SearchUsersResult)
  async searchUsers(
    @Arg('query', () => String) query: string,
    @Arg('filters', () => SearchUsersFilters, { nullable: true })
    filters: SearchUsersFilters | null | undefined,
    @Args()
    { currentPage = 1, pageSize = 25, order = Order.ASC }: Paginated,
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
      query,
      filters ?? null,
      currentPage,
      pageSize,
      order,
    )

    if (users.length === 0) {
      return {
        userCount: count,
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
    const user = await DbUser.findOne({ id: userId })
    // user exists ?
    if (!user) {
      throw new LogError('Could not find user with given ID', userId)
    }
    // administrator user changes own role?
    const moderator = getUser(context)
    if (moderator.id === userId) {
      throw new LogError('Administrator can not change his own role')
    }
    // change isAdmin
    switch (user.isAdmin) {
      case null:
        if (isAdmin) {
          user.isAdmin = new Date()
        } else {
          throw new LogError('User is already an usual user')
        }
        break
      default:
        if (!isAdmin) {
          user.isAdmin = null
        } else {
          throw new LogError('User is already admin')
        }
        break
    }
    await user.save()
    await EVENT_ADMIN_USER_ROLE_SET(user, moderator)
    const newUser = await DbUser.findOne({ id: userId })
    return newUser ? newUser.isAdmin : null
  }

  @Authorized([RIGHTS.DELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async deleteUser(
    @Arg('userId', () => Int) userId: number,
    @Ctx() context: Context,
  ): Promise<Date | null> {
    const user = await DbUser.findOne({ id: userId })
    // user exists ?
    if (!user) {
      throw new LogError('Could not find user with given ID', userId)
    }
    // moderator user disabled own account?
    const moderator = getUser(context)
    if (moderator.id === userId) {
      throw new LogError('Moderator can not delete his own account')
    }
    // soft-delete user
    await user.softRemove()
    await EVENT_ADMIN_USER_DELETE(user, moderator)
    const newUser = await DbUser.findOne({ id: userId }, { withDeleted: true })
    return newUser ? newUser.deletedAt : null
  }

  @Authorized([RIGHTS.UNDELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async unDeleteUser(
    @Arg('userId', () => Int) userId: number,
    @Ctx() context: Context,
  ): Promise<Date | null> {
    const user = await DbUser.findOne({ id: userId }, { withDeleted: true })
    if (!user) {
      throw new LogError('Could not find user with given ID', userId)
    }
    if (!user.deletedAt) {
      throw new LogError('User is not deleted')
    }
    await user.recover()
    await EVENT_ADMIN_USER_UNDELETE(user, getUser(context))
    return null
  }

  // TODO this is an admin function - needs refactor
  @Authorized([RIGHTS.SEND_ACTIVATION_EMAIL])
  @Mutation(() => Boolean)
  async sendActivationEmail(
    @Arg('email') email: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    email = email.trim().toLowerCase()
    // const user = await dbUser.findOne({ id: emailContact.userId })
    const user = await findUserByEmail(email)
    if (user.deletedAt || user.emailContact.deletedAt) {
      throw new LogError('User with given email contact is deleted', email)
    }

    user.emailContact.emailResendCount++
    await user.emailContact.save()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void sendAccountActivationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      language: user.language,
      activationLink: activationLink(user.emailContact.emailVerificationCode),
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    await EVENT_EMAIL_ADMIN_CONFIRMATION(user, getUser(context))

    return true
  }

  @Authorized([RIGHTS.USER])
  @Query(() => User)
  async user(@Arg('identifier') identifier: string): Promise<User> {
    return new User(await findUserByIdentifier(identifier))
  }
}

export async function findUserByEmail(email: string): Promise<DbUser> {
  const dbUserContact = await DbUserContact.findOneOrFail(
    { email },
    { withDeleted: true, relations: ['user'] },
  ).catch(() => {
    throw new LogError('No user with this credentials', email)
  })
  const dbUser = dbUserContact.user
  dbUser.emailContact = dbUserContact
  return dbUser
}

async function checkEmailExists(email: string): Promise<boolean> {
  const userContact = await DbUserContact.findOne({ email }, { withDeleted: true })
  if (userContact) {
    return true
  }
  return false
}

const isTimeExpired = (updatedAt: Date, duration: number): boolean => {
  const timeElapsed = Date.now() - new Date(updatedAt).getTime()
  // time is given in minutes
  return timeElapsed <= duration * 60 * 1000
}

const isEmailVerificationCodeValid = (updatedAt: Date): boolean => {
  return isTimeExpired(updatedAt, CONFIG.EMAIL_CODE_VALID_TIME)
}

const canEmailResend = (updatedAt: Date): boolean => {
  return !isTimeExpired(updatedAt, CONFIG.EMAIL_CODE_REQUEST_TIME)
}
