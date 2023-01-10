import i18n from 'i18n'
import { v4 as uuidv4 } from 'uuid'
import {
  Resolver,
  Query,
  Args,
  Arg,
  Authorized,
  Ctx,
  UseMiddleware,
  Mutation,
  Int,
} from 'type-graphql'
import { getConnection, getCustomRepository, IsNull, Not } from '@dbTools/typeorm'

import { User as DbUser } from '@entity/User'
import { UserContact as DbUserContact } from '@entity/UserContact'
import { TransactionLink as DbTransactionLink } from '@entity/TransactionLink'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { UserRepository } from '@repository/User'

import { User } from '@model/User'
import { SearchAdminUsersResult } from '@model/AdminUser'
import { UserAdmin, SearchUsersResult } from '@model/UserAdmin'
import { OptInType } from '@enum/OptInType'
import { Order } from '@enum/Order'
import { UserContactType } from '@enum/UserContactType'

import {
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendResetPasswordEmail,
} from '@/emails/sendEmailVariants'

import { getTimeDurationObject, printTimeDuration } from '@/util/time'
import CreateUserArgs from '@arg/CreateUserArgs'
import UnsecureLoginArgs from '@arg/UnsecureLoginArgs'
import UpdateUserInfosArgs from '@arg/UpdateUserInfosArgs'
import Paginated from '@arg/Paginated'
import SearchUsersArgs from '@arg/SearchUsersArgs'

import { backendLogger as logger } from '@/server/logger'
import { Context, getUser, getClientTimezoneOffset } from '@/server/context'
import CONFIG from '@/config'
import { communityDbUser } from '@/util/communityUser'
import { encode } from '@/auth/JWT'
import { klicktippNewsletterStateMiddleware } from '@/middleware/klicktippMiddleware'
import { klicktippSignIn } from '@/apis/KlicktippController'
import { RIGHTS } from '@/auth/RIGHTS'
import { hasElopageBuys } from '@/util/hasElopageBuys'
import { eventProtocol } from '@/event/EventProtocolEmitter'
import {
  Event,
  EventLogin,
  EventRedeemRegister,
  EventRegister,
  EventSendAccountMultiRegistrationEmail,
  EventSendConfirmationEmail,
  EventActivateAccount,
} from '@/event/Event'
import { getUserCreation, getUserCreations } from './util/creations'
import { isValidPassword } from '@/password/EncryptorUtils'
import { FULL_CREATION_AVAILABLE } from './const/const'
import { encryptPassword, verifyPassword } from '@/password/PasswordEncryptor'
import { PasswordEncryptionType } from '../enum/PasswordEncryptionType'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const random = require('random-bigint')

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
  logger.debug(`newEmailContact...successful: ${emailContact}`)
  return emailContact
}

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
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async verifyLogin(@Ctx() context: Context): Promise<User> {
    logger.info('verifyLogin...')
    // TODO refactor and do not have duplicate code with login(see below)
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    const userEntity = getUser(context)
    const user = new User(userEntity, await getUserCreation(userEntity.id, clientTimezoneOffset))
    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage(context)

    logger.debug(`verifyLogin... successful: ${user.firstName}.${user.lastName}, ${user.email}`)
    return user
  }

  @Authorized([RIGHTS.LOGIN])
  @Mutation(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async login(
    @Args() { email, password, publisherId }: UnsecureLoginArgs,
    @Ctx() context: Context,
  ): Promise<User> {
    logger.info(`login with ${email}, ***, ${publisherId} ...`)
    const clientTimezoneOffset = getClientTimezoneOffset(context)
    email = email.trim().toLowerCase()
    const dbUser = await findUserByEmail(email)
    if (dbUser.deletedAt) {
      logger.error('The User was permanently deleted in database.')
      throw new Error('This user was permanently deleted. Contact support for questions.')
    }
    if (!dbUser.emailContact.emailChecked) {
      logger.error('The Users email is not validate yet.')
      throw new Error('User email not validated')
    }
    if (dbUser.password === BigInt(0)) {
      logger.error('The User has not set a password yet.')
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      throw new Error('User has no password set yet')
    }

    if (!verifyPassword(dbUser, password)) {
      logger.error('The User has no valid credentials.')
      throw new Error('No user with this credentials')
    }

    if (dbUser.passwordEncryptionType !== PasswordEncryptionType.GRADIDO_ID) {
      dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      dbUser.password = encryptPassword(dbUser, password)
      await dbUser.save()
    }
    // add pubKey in logger-context for layout-pattern X{user} to print it in each logging message
    logger.addContext('user', dbUser.id)
    logger.debug('validation of login credentials successful...')

    const user = new User(dbUser, await getUserCreation(dbUser.id, clientTimezoneOffset))
    logger.debug(`user= ${JSON.stringify(user, null, 2)}`)

    i18n.setLocale(user.language)

    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage({ ...context, user: dbUser })
    logger.info('user.hasElopage=' + user.hasElopage)
    if (!user.hasElopage && publisherId) {
      user.publisherId = publisherId
      dbUser.publisherId = publisherId
      DbUser.save(dbUser)
    }

    context.setHeaders.push({
      key: 'token',
      value: encode(dbUser.gradidoID),
    })
    const ev = new EventLogin()
    ev.userId = user.id
    eventProtocol.writeEvent(new Event().setEventLogin(ev))
    logger.info(`successful Login: ${JSON.stringify(user, null, 2)}`)
    return user
  }

  @Authorized([RIGHTS.LOGOUT])
  @Mutation(() => String)
  async logout(): Promise<boolean> {
    // TODO: Event still missing here!!
    // TODO: We dont need this anymore, but might need this in the future in oder to invalidate a valid JWT-Token.
    // Furthermore this hook can be useful for tracking user behaviour (did he logout or not? Warn him if he didn't on next login)
    // The functionality is fully client side - the client just needs to delete his token with the current implementation.
    // we could try to force this by sending `token: null` or `token: ''` with this call. But since it bares no real security
    // we should just return true for now.
    logger.info('Logout...')
    // remove user.pubKey from logger-context to ensure a correct filter on log-messages belonging to the same user
    logger.addContext('user', 'unknown')
    return true
  }

  @Authorized([RIGHTS.CREATE_USER])
  @Mutation(() => User)
  async createUser(
    @Args()
    { email, firstName, lastName, language, publisherId, redeemCode = null }: CreateUserArgs,
  ): Promise<User> {
    logger.addContext('user', 'unknown')
    logger.info(
      `createUser(email=${email}, firstName=${firstName}, lastName=${lastName}, language=${language}, publisherId=${publisherId}, redeemCode =${redeemCode})`,
    )
    // TODO: wrong default value (should be null), how does graphql work here? Is it an required field?
    // default int publisher_id = 0;
    const event = new Event()

    // Validate Language (no throw)
    if (!language || !isLanguage(language)) {
      language = DEFAULT_LANGUAGE
    }
    i18n.setLocale(language)

    // check if user with email still exists?
    email = email.trim().toLowerCase()
    if (await checkEmailExists(email)) {
      const foundUser = await findUserByEmail(email)
      logger.info(`DbUser.findOne(email=${email}) = ${foundUser}`)

      if (foundUser) {
        // ATTENTION: this logger-message will be exactly expected during tests, next line
        logger.info(`User already exists with this email=${email}`)
        logger.info(
          `Specified username when trying to register multiple times with this email: firstName=${firstName}, lastName=${lastName}`,
        )
        // TODO: this is unsecure, but the current implementation of the login server. This way it can be queried if the user with given EMail is existent.

        const user = new User(communityDbUser)
        user.id = sodium.randombytes_random() % (2048 * 16) // TODO: for a better faking derive id from email so that it will be always the same id when the same email comes in?
        user.gradidoID = uuidv4()
        user.email = email
        user.firstName = firstName
        user.lastName = lastName
        user.language = language
        user.publisherId = publisherId
        logger.debug('partly faked user=' + user)

        const emailSent = await sendAccountMultiRegistrationEmail({
          firstName: foundUser.firstName, // this is the real name of the email owner, but just "firstName" would be the name of the new registrant which shall not be passed to the outside
          lastName: foundUser.lastName, // this is the real name of the email owner, but just "lastName" would be the name of the new registrant which shall not be passed to the outside
          email,
          language: foundUser.language, // use language of the emails owner for sending
        })
        const eventSendAccountMultiRegistrationEmail = new EventSendAccountMultiRegistrationEmail()
        eventSendAccountMultiRegistrationEmail.userId = foundUser.id
        eventProtocol.writeEvent(
          event.setEventSendConfirmationEmail(eventSendAccountMultiRegistrationEmail),
        )
        logger.info(
          `sendAccountMultiRegistrationEmail by ${firstName} ${lastName} to ${foundUser.firstName} ${foundUser.lastName} <${email}>`,
        )
        /* uncomment this, when you need the activation link on the console */
        // In case EMails are disabled log the activation link for the user
        if (!emailSent) {
          logger.debug(`Email not send!`)
        }
        logger.info('createUser() faked and send multi registration mail...')

        return user
      }
    }

    const gradidoID = await newGradidoID()

    const eventRegister = new EventRegister()
    const eventRedeemRegister = new EventRedeemRegister()
    const eventSendConfirmEmail = new EventSendConfirmationEmail()

    let dbUser = new DbUser()
    dbUser.gradidoID = gradidoID
    dbUser.firstName = firstName
    dbUser.lastName = lastName
    dbUser.language = language
    dbUser.publisherId = publisherId
    dbUser.passwordEncryptionType = PasswordEncryptionType.NO_PASSWORD
    logger.debug('new dbUser=' + dbUser)
    if (redeemCode) {
      if (redeemCode.match(/^CL-/)) {
        const contributionLink = await DbContributionLink.findOne({
          code: redeemCode.replace('CL-', ''),
        })
        logger.info('redeemCode found contributionLink=' + contributionLink)
        if (contributionLink) {
          dbUser.contributionLinkId = contributionLink.id
          eventRedeemRegister.contributionId = contributionLink.id
        }
      } else {
        const transactionLink = await DbTransactionLink.findOne({ code: redeemCode })
        logger.info('redeemCode found transactionLink=' + transactionLink)
        if (transactionLink) {
          dbUser.referrerId = transactionLink.userId
          eventRedeemRegister.transactionId = transactionLink.id
        }
      }
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    try {
      dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
        logger.error('Error while saving dbUser', error)
        throw new Error('error saving user')
      })
      let emailContact = newEmailContact(email, dbUser.id)
      emailContact = await queryRunner.manager.save(emailContact).catch((error) => {
        logger.error('Error while saving emailContact', error)
        throw new Error('error saving email user contact')
      })

      dbUser.emailContact = emailContact
      dbUser.emailId = emailContact.id
      await queryRunner.manager.save(dbUser).catch((error) => {
        logger.error('Error while updating dbUser', error)
        throw new Error('error updating user')
      })

      /*
      const emailOptIn = newEmailOptIn(dbUser.id)
      await queryRunner.manager.save(emailOptIn).catch((error) => {
        logger.error('Error while saving emailOptIn', error)
        throw new Error('error saving email opt in')
      })
      */

      const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
        /{optin}/g,
        emailContact.emailVerificationCode.toString(),
      ).replace(/{code}/g, redeemCode ? '/' + redeemCode : '')

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const emailSent = await sendAccountActivationEmail({
        firstName,
        lastName,
        email,
        language,
        activationLink,
        timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
      })
      logger.info(`sendAccountActivationEmail of ${firstName}.${lastName} to ${email}`)
      eventSendConfirmEmail.userId = dbUser.id
      eventProtocol.writeEvent(event.setEventSendConfirmationEmail(eventSendConfirmEmail))

      if (!emailSent) {
        logger.debug(`Account confirmation link: ${activationLink}`)
      }

      await queryRunner.commitTransaction()
      logger.addContext('user', dbUser.id)
    } catch (e) {
      logger.error(`error during create user with ${e}`)
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
    logger.info('createUser() successful...')

    if (redeemCode) {
      eventRedeemRegister.userId = dbUser.id
      await eventProtocol.writeEvent(event.setEventRedeemRegister(eventRedeemRegister))
    } else {
      eventRegister.userId = dbUser.id
      await eventProtocol.writeEvent(event.setEventRegister(eventRegister))
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
      logger.error(
        `email already sent less than ${printTimeDuration(
          CONFIG.EMAIL_CODE_REQUEST_TIME,
        )} minutes ago`,
      )
      throw new Error(
        `email already sent less than ${printTimeDuration(
          CONFIG.EMAIL_CODE_REQUEST_TIME,
        )} minutes ago`,
      )
    }

    user.emailContact.updatedAt = new Date()
    user.emailContact.emailResendCount++
    user.emailContact.emailVerificationCode = random(64)
    user.emailContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_RESET_PASSWORD
    await user.emailContact.save().catch(() => {
      logger.error('Unable to save email verification code= ' + user.emailContact)
      throw new Error('Unable to save email verification code.')
    })

    logger.info(`optInCode for ${email}=${user.emailContact}`)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const emailSent = await sendResetPasswordEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      language: user.language,
      resetLink: activationLink(user.emailContact.emailVerificationCode),
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    /*  uncomment this, when you need the activation link on the console */
    // In case EMails are disabled log the activation link for the user
    if (!emailSent) {
      logger.debug(
        `Reset password link: ${activationLink(user.emailContact.emailVerificationCode)}`,
      )
    }
    logger.info(`forgotPassword(${email}) successful...`)

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
      logger.error('Password entered is lexically invalid')
      throw new Error(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }

    // Load code
    /*
    const optInCode = await LoginEmailOptIn.findOneOrFail({ verificationCode: code }).catch(() => {
      logger.error('Could not login with emailVerificationCode')
      throw new Error('Could not login with emailVerificationCode')
    })
    */
    const userContact = await DbUserContact.findOneOrFail(
      { emailVerificationCode: code },
      { relations: ['user'] },
    ).catch(() => {
      logger.error('Could not login with emailVerificationCode')
      throw new Error('Could not login with emailVerificationCode')
    })
    logger.debug('userContact loaded...')
    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isEmailVerificationCodeValid(userContact.updatedAt || userContact.createdAt)) {
      logger.error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
      throw new Error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
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

    const event = new Event()

    try {
      // Save user
      await queryRunner.manager.save(user).catch((error) => {
        logger.error('error saving user: ' + error)
        throw new Error('error saving user: ' + error)
      })
      // Save userContact
      await queryRunner.manager.save(userContact).catch((error) => {
        logger.error('error saving userContact: ' + error)
        throw new Error('error saving userContact: ' + error)
      })

      await queryRunner.commitTransaction()
      logger.info('User and UserContact data written successfully...')

      const eventActivateAccount = new EventActivateAccount()
      eventActivateAccount.userId = user.id
      eventProtocol.writeEvent(event.setEventActivateAccount(eventActivateAccount))
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error('Error on writing User and UserContact data:' + e)
      throw e
    } finally {
      await queryRunner.release()
    }

    // Sign into Klicktipp
    // TODO do we always signUp the user? How to handle things with old users?
    if (userContact.emailOptInTypeId === OptInType.EMAIL_OPT_IN_REGISTER) {
      try {
        await klicktippSignIn(userContact.email, user.language, user.firstName, user.lastName)
        logger.debug(
          `klicktippSignIn(${userContact.email}, ${user.language}, ${user.firstName}, ${user.lastName})`,
        )
      } catch (e) {
        logger.error('Error subscribe to klicktipp:' + e)
        // TODO is this a problem?
        // eslint-disable-next-line no-console
        /*  uncomment this, when you need the activation link on the console
        console.log('Could not subscribe to klicktipp')
        */
      }
    }

    return true
  }

  @Authorized([RIGHTS.QUERY_OPT_IN])
  @Query(() => Boolean)
  async queryOptIn(@Arg('optIn') optIn: string): Promise<boolean> {
    logger.info(`queryOptIn(${optIn})...`)
    const userContact = await DbUserContact.findOneOrFail({ emailVerificationCode: optIn })
    logger.debug(`found optInCode=${userContact}`)
    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isEmailVerificationCodeValid(userContact.updatedAt || userContact.createdAt)) {
      logger.error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
      throw new Error(
        `email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }
    logger.info(`queryOptIn(${optIn}) successful...`)
    return true
  }

  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async updateUserInfos(
    @Args()
    { firstName, lastName, language, password, passwordNew }: UpdateUserInfosArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    logger.info(`updateUserInfos(${firstName}, ${lastName}, ${language}, ***, ***)...`)
    const userEntity = getUser(context)

    if (firstName) {
      userEntity.firstName = firstName
    }

    if (lastName) {
      userEntity.lastName = lastName
    }

    if (language) {
      if (!isLanguage(language)) {
        logger.error(`"${language}" isn't a valid language`)
        throw new Error(`"${language}" isn't a valid language`)
      }
      userEntity.language = language
      i18n.setLocale(language)
    }

    if (password && passwordNew) {
      // Validate Password
      if (!isValidPassword(passwordNew)) {
        logger.error('newPassword does not fullfil the rules')
        throw new Error(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
        )
      }

      if (!verifyPassword(userEntity, password)) {
        logger.error(`Old password is invalid`)
        throw new Error(`Old password is invalid`)
      }

      // Save new password hash and newly encrypted private key
      userEntity.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      userEntity.password = encryptPassword(userEntity, passwordNew)
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')

    try {
      await queryRunner.manager.save(userEntity).catch((error) => {
        logger.error('error saving user: ' + error)
        throw new Error('error saving user: ' + error)
      })

      await queryRunner.commitTransaction()
      logger.debug('writing User data successful...')
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error(`error on writing updated user data: ${e}`)
      throw e
    } finally {
      await queryRunner.release()
    }
    logger.info('updateUserInfos() successfully finished...')
    return true
  }

  @Authorized([RIGHTS.HAS_ELOPAGE])
  @Query(() => Boolean)
  async hasElopage(@Ctx() context: Context): Promise<boolean> {
    logger.info(`hasElopage()...`)
    const userEntity = getUser(context)
    const elopageBuys = hasElopageBuys(userEntity.emailContact.email)
    logger.debug(`has ElopageBuys = ${elopageBuys}`)
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
    const user = await DbUser.findOne({ id: userId })
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
    const newUser = await DbUser.findOne({ id: userId }, { withDeleted: true })
    return newUser ? newUser.deletedAt : null
  }

  @Authorized([RIGHTS.UNDELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async unDeleteUser(@Arg('userId', () => Int) userId: number): Promise<Date | null> {
    const user = await DbUser.findOne({ id: userId }, { withDeleted: true })
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
      logger.error(`The emailContact: ${email} of this User is deleted.`)
      throw new Error(`The emailContact: ${email} of this User is deleted.`)
    }

    emailContact.emailResendCount++
    await emailContact.save()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const emailSent = await sendAccountActivationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      language: user.language,
      activationLink: activationLink(emailContact.emailVerificationCode),
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
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
}

export async function findUserByEmail(email: string): Promise<DbUser> {
  const dbUserContact = await DbUserContact.findOneOrFail(
    { email: email },
    { withDeleted: true, relations: ['user'] },
  ).catch(() => {
    logger.error(`UserContact with email=${email} does not exists`)
    throw new Error('No user with this credentials')
  })
  const dbUser = dbUserContact.user
  dbUser.emailContact = dbUserContact
  return dbUser
}

async function checkEmailExists(email: string): Promise<boolean> {
  const userContact = await DbUserContact.findOne({ email: email }, { withDeleted: true })
  if (userContact) {
    return true
  }
  return false
}

/*
const isTimeExpired = (optIn: LoginEmailOptIn, duration: number): boolean => {
  const timeElapsed = Date.now() - new Date(optIn.updatedAt).getTime()
  // time is given in minutes
  return timeElapsed <= duration * 60 * 1000
}
*/
const isTimeExpired = (updatedAt: Date, duration: number): boolean => {
  const timeElapsed = Date.now() - new Date(updatedAt).getTime()
  // time is given in minutes
  return timeElapsed <= duration * 60 * 1000
}
/*
const isOptInValid = (optIn: LoginEmailOptIn): boolean => {
  return isTimeExpired(optIn, CONFIG.EMAIL_CODE_VALID_TIME)
}
*/
const isEmailVerificationCodeValid = (updatedAt: Date): boolean => {
  return isTimeExpired(updatedAt, CONFIG.EMAIL_CODE_VALID_TIME)
}
/*
const canResendOptIn = (optIn: LoginEmailOptIn): boolean => {
  return !isTimeExpired(optIn, CONFIG.EMAIL_CODE_REQUEST_TIME)
}
*/
const canEmailResend = (updatedAt: Date): boolean => {
  return !isTimeExpired(updatedAt, CONFIG.EMAIL_CODE_REQUEST_TIME)
}
