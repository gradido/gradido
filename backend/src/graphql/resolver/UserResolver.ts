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
import {
  Event,
  EventType,
  EVENT_LOGIN,
  EVENT_SEND_ACCOUNT_MULTIREGISTRATION_EMAIL,
  EVENT_SEND_CONFIRMATION_EMAIL,
  EVENT_REGISTER,
  EVENT_ACTIVATE_ACCOUNT,
  EVENT_ADMIN_SEND_CONFIRMATION_EMAIL,
} from '@/event/Event'
import { getUserCreations } from './util/creations'
import { isValidPassword } from '@/password/EncryptorUtils'
import { FULL_CREATION_AVAILABLE } from './const/const'
import { encryptPassword, verifyPassword } from '@/password/PasswordEncryptor'
import { PasswordEncryptionType } from '../enum/PasswordEncryptionType'
import LogError from '@/server/LogError'

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
    const userEntity = getUser(context)
    const user = new User(userEntity)
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

    await EVENT_LOGIN(dbUser)
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

        await EVENT_SEND_ACCOUNT_MULTIREGISTRATION_EMAIL(foundUser)

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

    const eventRegisterRedeem = Event(
      EventType.REDEEM_REGISTER,
      { id: 0 } as DbUser,
      { id: 0 } as DbUser,
    )
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
          eventRegisterRedeem.involvedContributionLink = contributionLink
        }
      } else {
        const transactionLink = await DbTransactionLink.findOne({ code: redeemCode })
        logger.info('redeemCode found transactionLink=' + transactionLink)
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

      await EVENT_SEND_CONFIRMATION_EMAIL(dbUser)

      if (!emailSent) {
        logger.debug(`Account confirmation link: ${activationLink}`)
      }

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
      await EVENT_REGISTER(dbUser)
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

      await EVENT_ACTIVATE_ACCOUNT(user)
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
        await klicktippSignIn(userContact.email, user.language, user.firstName, user.lastName)
        logger.debug(
          `klicktippSignIn(${userContact.email}, ${user.language}, ${user.firstName}, ${user.lastName})`,
        )
      } catch (e) {
        logger.error('Error subscribing to klicktipp', e)
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
      throw new LogError(
        `Email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }
    logger.info(`queryOptIn(${optIn}) successful...`)
    return true
  }

  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async updateUserInfos(
    @Args()
    {
      firstName,
      lastName,
      language,
      password,
      passwordNew,
      hideAmountGDD,
      hideAmountGDT,
    }: UpdateUserInfosArgs,
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
        throw new LogError('Given language is not a valid language', language)
      }
      userEntity.language = language
      i18n.setLocale(language)
    }

    if (password && passwordNew) {
      // Validate Password
      if (!isValidPassword(passwordNew)) {
        throw new LogError(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
        )
      }

      if (!verifyPassword(userEntity, password)) {
        throw new LogError(`Old password is invalid`)
      }

      // Save new password hash and newly encrypted private key
      userEntity.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      userEntity.password = encryptPassword(userEntity, passwordNew)
    }

    // Save hideAmountGDD value
    if (hideAmountGDD !== undefined) {
      userEntity.hideAmountGDD = hideAmountGDD
    }
    // Save hideAmountGDT value
    if (hideAmountGDT !== undefined) {
      userEntity.hideAmountGDT = hideAmountGDT
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')

    try {
      await queryRunner.manager.save(userEntity).catch((error) => {
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

  @Authorized([RIGHTS.ADMIN_SEARCH_USERS])
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

  @Authorized([RIGHTS.ADMIN_SET_USER_ROLE])
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
    const moderatorUser = getUser(context)
    if (moderatorUser.id === userId) {
      throw new LogError('Administrator can not change his own role')
    }
    // change isAdmin
    switch (user.isAdmin) {
      case null:
        if (isAdmin === true) {
          user.isAdmin = new Date()
        } else {
          throw new LogError('User is already an usual user')
        }
        break
      default:
        if (isAdmin === false) {
          user.isAdmin = null
        } else {
          throw new LogError('User is already admin')
        }
        break
    }
    await user.save()
    const newUser = await DbUser.findOne({ id: userId })
    return newUser ? newUser.isAdmin : null
  }

  @Authorized([RIGHTS.ADMIN_DELETE_USER])
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
    const moderatorUser = getUser(context)
    if (moderatorUser.id === userId) {
      throw new LogError('Moderator can not delete his own account')
    }
    // soft-delete user
    await user.softRemove()
    const newUser = await DbUser.findOne({ id: userId }, { withDeleted: true })
    return newUser ? newUser.deletedAt : null
  }

  @Authorized([RIGHTS.ADMIN_UNDELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async unDeleteUser(@Arg('userId', () => Int) userId: number): Promise<Date | null> {
    const user = await DbUser.findOne({ id: userId }, { withDeleted: true })
    if (!user) {
      throw new LogError('Could not find user with given ID', userId)
    }
    if (!user.deletedAt) {
      throw new LogError('User is not deleted')
    }
    await user.recover()
    return null
  }

  // TODO this is an admin function - needs refactor
  @Authorized([RIGHTS.ADMIN_SEND_ACTIVATION_EMAIL])
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
    const emailSent = await sendAccountActivationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      language: user.language,
      activationLink: activationLink(user.emailContact.emailVerificationCode),
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    // In case EMails are disabled log the activation link for the user
    if (!emailSent) {
      logger.info(`Account confirmation link: ${activationLink}`)
    } else {
      await EVENT_ADMIN_SEND_CONFIRMATION_EMAIL(user, getUser(context))
    }

    return true
  }
}

export async function findUserByEmail(email: string): Promise<DbUser> {
  const dbUserContact = await DbUserContact.findOneOrFail(
    { email: email },
    { withDeleted: true, relations: ['user'] },
  ).catch(() => {
    throw new LogError('No user with this credentials', email)
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
