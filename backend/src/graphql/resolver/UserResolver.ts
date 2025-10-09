import {
  AppDatabase,
  ContributionLink as DbContributionLink,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  UserContact as DbUserContact,
  ProjectBranding,
  UserLoggingView,
  getHomeCommunity, 
  findUserByIdentifier 
} from 'database'
import { GraphQLResolveInfo } from 'graphql'
import i18n from 'i18n'
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
import { IRestResponse } from 'typed-rest-client'
import { EntityManager, EntityNotFoundError, In, Point } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

import { UserArgs } from '@arg//UserArgs'
import { CreateUserArgs } from '@arg/CreateUserArgs'
import { Paginated } from '@arg/Paginated'
import { SearchUsersFilters } from '@arg/SearchUsersFilters'
import { SetUserRoleArgs } from '@arg/SetUserRoleArgs'
import { UnsecureLoginArgs } from '@arg/UnsecureLoginArgs'
import { UpdateUserInfosArgs } from '@arg/UpdateUserInfosArgs'
import { OptInType } from '@enum/OptInType'
import { Order } from '@enum/Order'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { PublishNameType } from '@enum/PublishNameType'
import { UserContactType } from '@enum/UserContactType'
import { SearchAdminUsersResult } from '@model/AdminUser'
// import { Location } from '@model/Location'
import { GmsUserAuthenticationResult } from '@model/GmsUserAuthenticationResult'
import { User } from '@model/User'
import { SearchUsersResult, UserAdmin } from '@model/UserAdmin'
import { UserContact } from '@model/UserContact'
import { UserLocationResult } from '@model/UserLocationResult'

import { subscribe } from '@/apis/KlicktippController'
import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { Account as HumhubAccount } from '@/apis/humhub/model/Account'
import { GetUser } from '@/apis/humhub/model/GetUser'
import { PostUser } from '@/apis/humhub/model/PostUser'
import { encode } from '@/auth/JWT'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { PublishNameLogic } from '@/data/PublishName.logic'
import {
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendResetPasswordEmail,
} from '@/emails/sendEmailVariants'
import {
  EVENT_ADMIN_USER_DELETE,
  EVENT_ADMIN_USER_ROLE_SET,
  EVENT_ADMIN_USER_UNDELETE,
  EVENT_EMAIL_ACCOUNT_MULTIREGISTRATION,
  EVENT_EMAIL_ADMIN_CONFIRMATION,
  EVENT_EMAIL_CONFIRMATION,
  EVENT_EMAIL_FORGOT_PASSWORD,
  EVENT_USER_ACTIVATE_ACCOUNT,
  EVENT_USER_INFO_UPDATE,
  EVENT_USER_LOGIN,
  EVENT_USER_LOGOUT,
  EVENT_USER_REGISTER,
  Event,
  EventType,
} from '@/event/Events'
import { isValidPassword } from '@/password/EncryptorUtils'
import { encryptPassword, verifyPassword } from '@/password/PasswordEncryptor'
import { LogError } from '@/server/LogError'
import { Context, getClientTimezoneOffset, getUser } from '@/server/context'
import { communityDbUser } from '@/util/communityUser'
import { hasElopageBuys } from '@/util/hasElopageBuys'
import { durationInMinutesFromDates, getTimeDurationObject, printTimeDuration } from '@/util/time'
import { delay } from 'core'

import random from 'random-bigint'
import { randombytes_random } from 'sodium-native'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { Logger, getLogger } from 'log4js'
import { FULL_CREATION_AVAILABLE } from './const/const'
import { Location2Point, Point2Location } from './util/Location2Point'
import { authenticateGmsUserPlayground } from './util/authenticateGmsUserPlayground'
import { compareGmsRelevantUserSettings } from './util/compareGmsRelevantUserSettings'
import { getUserCreations } from './util/creations'
import { extractGraphQLFieldsForSelect } from './util/extractGraphQLFields'
import { findUsers } from './util/findUsers'
import { getKlicktippState } from './util/getKlicktippState'
import { deleteUserRole, setUserRole } from './util/modifyUserRole'
import { sendUserToGms } from './util/sendUserToGms'
import { syncHumhub } from './util/syncHumhub'
import { validateAlias } from 'core'
import { updateAllDefinedAndChanged } from 'shared'

const LANGUAGES = ['de', 'en', 'es', 'fr', 'nl']
const DEFAULT_LANGUAGE = 'de'
const db = AppDatabase.getInstance()
const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.UserResolver`)
const isLanguage = (language: string): boolean => {
  return LANGUAGES.includes(language)
}

const newEmailContact = (email: string, userId: number, logger: Logger): DbUserContact => {
  logger.trace(`newEmailContact...`)
  const emailContact = new DbUserContact()
  emailContact.email = email
  emailContact.userId = userId
  emailContact.type = UserContactType.USER_CONTACT_EMAIL
  emailContact.emailChecked = false
  emailContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
  emailContact.emailVerificationCode = random(64).toString()
  logger.debug('newEmailContact...successful', emailContact)
  return emailContact
}

export const activationLink = (verificationCode: string, logger: Logger): string => {
  logger.debug(`activationLink(${verificationCode})...`)
  return CONFIG.EMAIL_LINK_SETPASSWORD + verificationCode.toString()
}

const newGradidoID = async (logger: Logger): Promise<string> => {
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

@Resolver(() => User)
export class UserResolver {
  @Authorized([RIGHTS.VERIFY_LOGIN])
  @Query(() => User)
  async verifyLogin(@Ctx() context: Context): Promise<User> {
    const logger = createLogger()
    logger.info('verifyLogin...')
    // TODO refactor and do not have duplicate code with login(see below)
    const userEntity = getUser(context)
    logger.addContext('user', userEntity.id)
    const user = new User(userEntity)
    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage(context)

    logger.debug(`verifyLogin... successful`)
    user.klickTipp = await getKlicktippState(userEntity.emailContact.email)
    return user
  }

  @Authorized([RIGHTS.LOGIN])
  @Mutation(() => User)
  async login(
    @Args() { email, password, publisherId, project }: UnsecureLoginArgs,
    @Ctx() context: Context,
  ): Promise<User> {
    const logger = createLogger()
    logger.info(`login with ${email.substring(0, 3)}..., project=${project} ...`)
    email = email.trim().toLowerCase()
    let dbUser: DbUser

    try {
      dbUser = await findUserByEmail(email)
      // add technical user identifier in logger-context for layout-pattern X{user} to print it in each logging message
      logger.addContext('user', dbUser.id)
      logger.trace('user before login', new UserLoggingView(dbUser))
    } catch (e) {
      // simulate delay which occur on password encryption 650 ms +- 50 rnd
      await delay(650 + Math.floor(Math.random() * 101) - 50)
      throw e
    }
    if (dbUser.deletedAt) {
      logger.warn('login failed, user was deleted')
      throw new Error('This user was permanently deleted. Contact support for questions')
    }
    if (!dbUser.emailContact.emailChecked) {
      logger.warn('login failed, user email not checked')
      throw new Error('The Users email is not validate yet')
    }
    // TODO: at least in test this does not work since `dbUser.password = 0` and `BigInto(0) = 0n`
    if (dbUser.password === BigInt(0)) {
      // TODO we want to catch this on the frontend and ask the user to check his emails or resend code
      logger.warn('login failed, user has not set a password yet')
      throw new Error('The User has not set a password yet')
    }
    if (!(await verifyPassword(dbUser, password))) {
      logger.warn('login failed, wrong password')
      throw new Error('No user with this credentials')
    }

    // request to humhub and klicktipp run in parallel
    let humhubUserPromise: Promise<IRestResponse<GetUser>> | undefined
    let projectBrandingPromise: Promise<ProjectBranding | null> | undefined
    const klicktippStatePromise = getKlicktippState(dbUser.emailContact.email)
    if (CONFIG.HUMHUB_ACTIVE && dbUser.humhubAllowed) {
      const getHumhubUser = new PostUser(dbUser)
      humhubUserPromise = HumHubClient.getInstance()?.userByUsernameAsync(
        getHumhubUser.account.username,
      )
    }
    if (project) {
      projectBrandingPromise = ProjectBranding.findOne({
        where: { alias: project },
        select: { spaceId: true },
      })
    }

    if (
      (dbUser.passwordEncryptionType as PasswordEncryptionType) !==
      PasswordEncryptionType.GRADIDO_ID
    ) {
      dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      dbUser.password = await encryptPassword(dbUser, password)
      await dbUser.save()
    }
    logger.debug('validation of login credentials successful...')

    const user = new User(dbUser)
    i18n.setLocale(user.language)

    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage({ ...context, user: dbUser })
    logger.debug('user.hasElopage', user.hasElopage)
    if (!user.hasElopage && publisherId) {
      user.publisherId = publisherId
      dbUser.publisherId = publisherId
      await DbUser.save(dbUser)
    }

    context.setHeaders.push({
      key: 'token',
      value: await encode(dbUser.gradidoID),
    })

    await EVENT_USER_LOGIN(dbUser)
    const projectBranding = await projectBrandingPromise
    logger.debug('project branding: ', projectBranding?.id)
    // load humhub state
    if (humhubUserPromise) {
      try {
        const result = await humhubUserPromise
        user.humhubAllowed = result?.result?.account.status === 1
        if (user.humhubAllowed && result?.result?.account?.username) {
          let spaceId = null
          if (projectBranding) {
            spaceId = projectBranding.spaceId
          }
          await syncHumhub(null, dbUser, result.result.account.username, spaceId)
        }
      } catch (e) {
        logger.error("couldn't reach out to humhub, disable for now", e)
        user.humhubAllowed = false
      }
    }
    user.klickTipp = await klicktippStatePromise
    logger.info('successful Login')
    logger.trace('user after login', new UserLoggingView(dbUser))
    return user
  }

  @Authorized([RIGHTS.LOGOUT])
  @Mutation(() => Boolean)
  async logout(@Ctx() context: Context): Promise<boolean> {
    await EVENT_USER_LOGOUT(getUser(context))
    return true
  }

  @Authorized([RIGHTS.CREATE_USER])
  @Mutation(() => User)
  async createUser(
    @Args()
    {
      alias = null,
      email,
      firstName,
      lastName,
      language,
      publisherId = null,
      redeemCode = null,
      project = null,
    }: CreateUserArgs,
  ): Promise<User> {
    const logger = createLogger()
    const shortEmail = email.substring(0, 3)
    logger.addContext('email', shortEmail)

    const shortRedeemCode = redeemCode?.substring(0, 6)
    const infos = []
    infos.push(`language=${language}`)
    if (publisherId) {
      infos.push(`publisherId=${publisherId}`)
    }
    if (redeemCode) {
      infos.push(`redeemCode=${shortRedeemCode}`)
    }
    if (project) {
      infos.push(`project=${project}`)
    }
    logger.info(`createUser(${infos.join(', ')})`)

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
      logger.info('DbUser.findOne', foundUser.id)

      if (foundUser) {
        logger.addContext('user', foundUser.id)
        logger.removeContext('email')
        // ATTENTION: this logger-message will be exactly expected during tests, next line
        logger.info(`User already exists`)
        logger.info(
          `Specified username when trying to register multiple times with this email: firstName=${firstName.substring(0, 4)}, lastName=${lastName.substring(0, 4)}`,
        )

        const user = new User(communityDbUser)
        user.id = randombytes_random() % (2048 * 16) // TODO: for a better faking derive id from email so that it will be always the same id when the same email comes in?
        user.gradidoID = uuidv4()
        user.firstName = firstName
        user.lastName = lastName
        user.language = language
        user.publisherId = publisherId
        if (alias && (await validateAlias(alias))) {
          user.alias = alias
        }
        logger.debug('partly faked user', { id: user.id, gradidoID: user.gradidoID })

        await sendAccountMultiRegistrationEmail({
          firstName: foundUser.firstName, // this is the real name of the email owner, but just "firstName" would be the name of the new registrant which shall not be passed to the outside
          lastName: foundUser.lastName, // this is the real name of the email owner, but just "lastName" would be the name of the new registrant which shall not be passed to the outside
          email,
          language: foundUser.language, // use language of the emails owner for sending
        })
        await EVENT_EMAIL_ACCOUNT_MULTIREGISTRATION(foundUser)

        /* uncomment this, when you need the activation link on the console */
        // In case EMails are disabled log the activation link for the user
        logger.info('createUser() faked and send multi registration mail...')

        return user
      }
    }
    let projectBrandingPromise: Promise<ProjectBranding | null> | undefined
    if (project) {
      projectBrandingPromise = ProjectBranding.findOne({
        where: { alias: project },
        select: { logoUrl: true, spaceId: true },
      })
    }
    const gradidoID = await newGradidoID(logger)

    const eventRegisterRedeem = Event(
      EventType.USER_REGISTER_REDEEM,
      { id: 0 } as DbUser,
      { id: 0 } as DbUser,
    )
    let dbUser = new DbUser()
    const homeCom = await getHomeCommunity()
    if (!homeCom) {
      logger.error('no home community found, please start the dht-node first')
      throw new Error(`Error creating user, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`)
    }
    if (homeCom.communityUuid) {
      dbUser.communityUuid = homeCom.communityUuid
    }
    dbUser.gradidoID = gradidoID
    dbUser.firstName = firstName
    dbUser.lastName = lastName
    dbUser.language = language
    // enable humhub from now on for new user
    dbUser.humhubAllowed = true
    if (alias && (await validateAlias(alias))) {
      dbUser.alias = alias
    }
    dbUser.publisherId = publisherId ?? 0
    dbUser.passwordEncryptionType = PasswordEncryptionType.NO_PASSWORD
    logger.debug('new dbUser', new UserLoggingView(dbUser))
    if (redeemCode) {
      if (redeemCode.match(/^CL-/)) {
        const contributionLink = await DbContributionLink.findOne({
          where: { code: redeemCode.replace('CL-', '') },
        })
        if (contributionLink) {
          logger.info('redeemCode found contributionLink', contributionLink.id)
          dbUser.contributionLinkId = contributionLink.id
          eventRegisterRedeem.involvedContributionLink = contributionLink
        }
      } else {
        const transactionLink = await DbTransactionLink.findOne({ where: { code: redeemCode } })
        if (transactionLink) {
          logger.info('redeemCode found transactionLink', transactionLink.id)
          dbUser.referrerId = transactionLink.userId
          eventRegisterRedeem.involvedTransactionLink = transactionLink
        }
      }
    }

    const queryRunner = db.getDataSource().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    let projectBranding: ProjectBranding | null | undefined
    try {
      dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
        throw new LogError('Error while saving dbUser', error)
      })
      let emailContact = newEmailContact(email, dbUser.id, logger)
      emailContact = await queryRunner.manager.save(emailContact).catch((error) => {
        throw new LogError('Error while saving user email contact', error)
      })

      dbUser.emailContact = emailContact
      dbUser.emailId = emailContact.id
      await queryRunner.manager.save(dbUser).catch((error) => {
        throw new LogError('Error while updating dbUser', error)
      })

      const activationLink = `${
        CONFIG.EMAIL_LINK_VERIFICATION
      }${emailContact.emailVerificationCode.toString()}${redeemCode ? `/${redeemCode}` : ''}${
        project ? `?project=` + project : ''
      }`

      projectBranding = projectBrandingPromise ? await projectBrandingPromise : undefined
      await sendAccountActivationEmail({
        firstName,
        lastName,
        email,
        language,
        activationLink,
        timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
        logoUrl: projectBranding?.logoUrl,
      })
      logger.info('sendAccountActivationEmail')

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
    if (CONFIG.HUMHUB_ACTIVE) {
      let spaceId: number | null = null
      if (projectBranding) {
        spaceId = projectBranding.spaceId
      }
      try {
        await syncHumhub(null, dbUser, dbUser.gradidoID, spaceId)
      } catch (e) {
        logger.error("createUser: couldn't reach out to humhub, disable for now", e)
      }
    }

    if (redeemCode) {
      eventRegisterRedeem.affectedUser = dbUser
      eventRegisterRedeem.actingUser = dbUser
      await eventRegisterRedeem.save()
    } else {
      await EVENT_USER_REGISTER(dbUser)
    }

    if (!CONFIG.GMS_ACTIVE) {
      logger.info('GMS deactivated per configuration! New user is not published to GMS.')
    } else {
      try {
        if (dbUser.gmsAllowed && !dbUser.gmsRegistered) {
          await sendUserToGms(dbUser, homeCom)
        }
      } catch (err) {
        if (CONFIG.GMS_CREATE_USER_THROW_ERRORS) {
          throw new LogError('Error publishing new created user to GMS:', err)
        } else {
          logger.error('Error publishing new created user to GMS:', err)
        }
      }
    }
    return new User(dbUser)
  }

  @Authorized([RIGHTS.SEND_RESET_PASSWORD_EMAIL])
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string): Promise<boolean> {
    const logger = createLogger()
    const shortEmail = email.substring(0, 3)
    logger.addContext('email', shortEmail)
    logger.info('forgotPassword...')
    email = email.trim().toLowerCase()
    let user: DbUser
    try {
      user = await findUserByEmail(email)
      logger.removeContext('email')
      logger.addContext('user', user.id)
    } catch (_e) {
      logger.warn(`fail on find UserContact`)
      return true
    }

    if (user.deletedAt) {
      logger.warn(`user was deleted`)
      return true
    }
    if (!canEmailResend(user.emailContact.updatedAt || user.emailContact.createdAt)) {
      const diff = durationInMinutesFromDates(
        user.emailContact.updatedAt || user.emailContact.createdAt,
        new Date(),
      )
      logger.warn(
        `email already sent ${printTimeDuration(diff)} ago, min wait time: ${printTimeDuration(CONFIG.EMAIL_CODE_REQUEST_TIME)}`,
      )
      throw new LogError(
        `Email already sent less than ${printTimeDuration(CONFIG.EMAIL_CODE_REQUEST_TIME)} ago`,
      )
    }

    user.emailContact.updatedAt = new Date()
    user.emailContact.emailResendCount++
    user.emailContact.emailVerificationCode = random(64).toString()
    user.emailContact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_RESET_PASSWORD
    await user.emailContact.save().catch(() => {
      throw new LogError('Unable to save email verification code', user.emailContact.id)
    })

    await sendResetPasswordEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      language: user.language,
      resetLink: activationLink(user.emailContact.emailVerificationCode, logger),
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    logger.info(`forgotPassword successful...`)
    await EVENT_EMAIL_FORGOT_PASSWORD(user)

    return true
  }

  @Authorized([RIGHTS.SET_PASSWORD])
  @Mutation(() => Boolean)
  async setPassword(
    @Arg('code') code: string,
    @Arg('password') password: string,
  ): Promise<boolean> {
    const logger = createLogger()
    logger.info(`setPassword...`)
    // Validate Password
    if (!isValidPassword(password)) {
      throw new LogError(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }
    // load code
    const userContact = await DbUserContact.findOneOrFail({
      where: { emailVerificationCode: code },
      relations: ['user'],
    }).catch(() => {
      // code wasn't in db, so we can write it into log without hesitation
      logger.warn(`invalid emailVerificationCode=${code}`)
      throw new Error('Could not login with emailVerificationCode')
    })
    logger.addContext('user', userContact.user.id)
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
    user.password = await encryptPassword(user, password)
    logger.debug('User credentials updated ...')

    const queryRunner = db.getDataSource().createQueryRunner()
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
    if ((userContact.emailOptInTypeId as OptInType) === OptInType.EMAIL_OPT_IN_REGISTER) {
      try {
        await subscribe(userContact.email, user.language, user.firstName, user.lastName)
        logger.debug('Success subscribe to klicktipp')
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
    const logger = createLogger()
    logger.addContext('optIn', optIn.substring(0, 4))
    logger.info(`queryOptIn...`)
    const userContact = await DbUserContact.findOneOrFail({
      where: { emailVerificationCode: optIn },
    })
    logger.addContext('user', userContact.userId)
    logger.debug('found optInCode', userContact.id)
    // Code is only valid for `CONFIG.EMAIL_CODE_VALID_TIME` minutes
    if (!isEmailVerificationCodeValid(userContact.updatedAt || userContact.createdAt)) {
      throw new LogError(
        `Email was sent more than ${printTimeDuration(CONFIG.EMAIL_CODE_VALID_TIME)} ago`,
      )
    }
    logger.info(`queryOptIn successful...`)
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
    @Args() updateUserInfosArgs: UpdateUserInfosArgs,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const {
      firstName,
      lastName,
      alias,
      language,
      password,
      passwordNew,
      hideAmountGDD,
      hideAmountGDT,
      humhubAllowed,
      gmsAllowed,
      gmsPublishName,
      humhubPublishName,
      gmsLocation,
      gmsPublishLocation,
    } = updateUserInfosArgs
    const user = getUser(context)
    const logger = createLogger()
    logger.addContext('user', user.id)
    // log only if a value is set
    logger.info(`updateUserInfos...`, {
      firstName: firstName !== undefined,
      lastName: lastName !== undefined,
      alias: alias !== undefined,
      language: language !== undefined,
      password: password !== undefined,
      passwordNew: passwordNew !== undefined,
      hideAmountGDD: hideAmountGDD !== undefined,
      hideAmountGDT: hideAmountGDT !== undefined,
      humhubAllowed: humhubAllowed !== undefined,
      gmsAllowed: gmsAllowed !== undefined,
      gmsPublishName: gmsPublishName !== undefined,
      humhubPublishName: humhubPublishName !== undefined,
      gmsLocation: gmsLocation !== undefined,
      gmsPublishLocation: gmsPublishLocation !== undefined,
    })

    const updateUserInGMS = compareGmsRelevantUserSettings(user, updateUserInfosArgs)
    const publishNameLogic = new PublishNameLogic(user)
    const oldHumhubUsername = publishNameLogic.getUserIdentifier(
      user.humhubPublishName as PublishNameType,
    )

    let updated = updateAllDefinedAndChanged(user, { 
      firstName, 
      lastName, 
      hideAmountGDD, 
      hideAmountGDT, 
      humhubAllowed, 
      gmsAllowed, 
      gmsPublishName: gmsPublishName?.valueOf(),
      humhubPublishName: humhubPublishName?.valueOf(),
      gmsPublishLocation: gmsPublishLocation?.valueOf(),
    })

    // currently alias can only be set, not updated
    if (alias && !user.alias && (await validateAlias(alias))) {
      user.alias = alias
      updated = true
    }

    if (language) {
      if (!isLanguage(language)) {
        logger.warn('try to set unsupported language', language)
        throw new LogError('Given language is not a valid language or not supported')
      }
      user.language = language
      i18n.setLocale(language)
      updated = true
    }

    if (password && passwordNew) {
      // Validate Password
      if (!isValidPassword(passwordNew)) {
        // TODO: log which rule(s) wasn't met
        logger.warn('try to set invalid password')
        throw new Error(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
        )
      }

      if (!(await verifyPassword(user, password))) {
        logger.debug('old password is invalid')
        throw new LogError(`Old password is invalid`)
      }

      // Save new password hash and newly encrypted private key
      user.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      user.password = await encryptPassword(user, passwordNew)
      updated = true
    }

    if (gmsLocation) {
      user.location = Location2Point(gmsLocation)
      updated = true
    }

    // early exit if no update was made
    if (!updated) {
      return true
    }

    try {
      await DbUser.save(user)
    } catch (error) {
      const errorMessage = 'Error saving user'
      logger.error(errorMessage, error)
      throw new Error(errorMessage)
    }
    logger.info('updateUserInfos() successfully finished...')
    logger.debug('writing User data successful...', new UserLoggingView(user))
    await EVENT_USER_INFO_UPDATE(user)

    // validate if user settings are changed with relevance to update gms-user
    try {
      if (CONFIG.GMS_ACTIVE && updateUserInGMS) {
        logger.debug(`changed user-settings relevant for gms-user update...`)
        const homeCom = await getHomeCommunity()
        if (!homeCom) {
          logger.error('no home community found, please start the dht-node first')
          throw new Error(
            `Error updating user, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`
          )
        }
        if (homeCom.gmsApiKey !== null) {
          logger.debug(`send User to Gms...`)
          await sendUserToGms(user, homeCom)
          logger.debug(`sendUserToGms successfully.`)
        }
      }
    } catch (e) {
      logger.error('error sync user with gms', e)
    }
    try {
      if (CONFIG.HUMHUB_ACTIVE) {
        await syncHumhub(updateUserInfosArgs, user, oldHumhubUsername)
      }
    } catch (e) {
      logger.error('error sync user with humhub', e)
    }

    return true
  }

  @Authorized([RIGHTS.HAS_ELOPAGE])
  @Query(() => Boolean)
  async hasElopage(@Ctx() context: Context): Promise<boolean> {
    const dbUser = getUser(context)
    const logger = createLogger()
    logger.addContext('user', dbUser.id)
    const elopageBuys = await hasElopageBuys(dbUser.emailContact.email)
    logger.info(`has Elopage (ablify): ${elopageBuys}`)
    return elopageBuys
  }

  @Authorized([RIGHTS.GMS_USER_PLAYGROUND])
  @Query(() => GmsUserAuthenticationResult)
  async authenticateGmsUserSearch(@Ctx() context: Context): Promise<GmsUserAuthenticationResult> {
    const dbUser = getUser(context)
    const logger = createLogger()
    logger.addContext('user', dbUser.id)
    logger.info(`authenticateGmsUserSearch()...`)

    let result = new GmsUserAuthenticationResult()
    if (context.token) {
      const homeCom = await getHomeCommunity()
      if (!homeCom) {
        logger.error("couldn't authenticate for gms, no home community found, please start the dht-node first")
        throw new Error(
          `Error authenticating for gms, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`
        )
      }
      if (!homeCom.gmsApiKey) {
        throw new LogError('authenticateGmsUserSearch missing HomeCommunity GmsApiKey')
      }
      // TODO: NEVER pass user JWT token to another server - serious security risk! 😱⚠️
      result = await authenticateGmsUserPlayground(homeCom.gmsApiKey, context.token, dbUser)
      logger.info('authenticateGmsUserSearch=', result)
    } else {
      throw new LogError('authenticateGmsUserSearch missing valid user login-token')
    }
    return result
  }

  @Authorized([RIGHTS.GMS_USER_PLAYGROUND])
  @Query(() => UserLocationResult)
  async userLocation(@Ctx() context: Context): Promise<UserLocationResult> {
    const dbUser = getUser(context)
    const logger = createLogger()
    logger.addContext('user', dbUser.id)
    logger.info(`userLocation()...`)

    const result = new UserLocationResult()
    if (context.token) {
      const homeCom = await getHomeCommunity()
      if (!homeCom) {
        logger.error("couldn't load home community location, no home community found, please start the dht-node first")
        throw new Error(
          `Error loading user location, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`
        )
      }
      result.communityLocation = Point2Location(homeCom.location as Point)
      result.userLocation = Point2Location(dbUser.location as Point)
      logger.info('userLocation=', result)
    } else {
      throw new LogError('userLocation missing valid user login-token')
    }
    return result
  }

  @Authorized([RIGHTS.HUMHUB_AUTO_LOGIN])
  @Mutation(() => String)
  async authenticateHumhubAutoLogin(
    @Ctx() context: Context,
    @Arg('project', () => String, { nullable: true }) project?: string | null,
  ): Promise<string> {
    const dbUser = getUser(context)
    const logger = createLogger()
    logger.addContext('user', dbUser.id)
    logger.info(`authenticateHumhubAutoLogin()...`)

    const humhubClient = HumHubClient.getInstance()
    if (!humhubClient) {
      throw new LogError('cannot create humhub client')
    }
    // should rarely happen, so we don't optimize for parallel processing
    if (!dbUser.humhubAllowed && project) {
      await ProjectBranding.findOneOrFail({ where: { alias: project } })
      dbUser.humhubAllowed = true
      await dbUser.save()
    }
    const humhubUserAccount = new HumhubAccount(dbUser)
    const autoLoginUrlPromise = humhubClient.createAutoLoginUrl(humhubUserAccount.username, project)
    const humhubUser = await syncHumhub(null, dbUser, humhubUserAccount.username)
    if (!humhubUser) {
      throw new LogError("user don't exist (any longer) on humhub and couldn't be created")
    }
    if (humhubUser.account.status !== 1) {
      throw new LogError('user status is not 1', humhubUser.account.status)
    }
    const autoLoginUrl = await autoLoginUrlPromise
    return autoLoginUrl
  }

  @Authorized([RIGHTS.SEARCH_ADMIN_USERS])
  @Query(() => SearchAdminUsersResult)
  async searchAdminUsers(
    @Args()
    { currentPage = 1, pageSize = 25, order = Order.DESC }: Paginated,
  ): Promise<SearchAdminUsersResult> {
    const [users, count] = await DbUser.findAndCount({
      relations: ['userRoles'],
      where: {
        userRoles: { role: In(['admin', 'moderator']) },
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
          role: user.userRoles ? user.userRoles[0].role : '',
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
    const userFields = ['id', 'firstName', 'lastName', 'emailId', 'emailContact', 'deletedAt']
    const [users, count] = await findUsers(
      userFields,
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
        if (!user.emailContact?.emailChecked) {
          if (user.emailContact?.updatedAt) {
            emailConfirmationSend = user.emailContact?.updatedAt.toISOString()
          } else {
            emailConfirmationSend = user.emailContact?.createdAt.toISOString()
          }
        }
        const userCreations = creations.find((c) => c.id === user.id)
        const adminUser = new UserAdmin(
          user,
          userCreations ? userCreations.creations : FULL_CREATION_AVAILABLE,
          await hasElopageBuys(user.emailContact?.email),
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
  @Mutation(() => String, { nullable: true })
  async setUserRole(
    @Args() { userId, role }: SetUserRoleArgs,
    @Ctx()
    context: Context,
  ): Promise<string | null> {
    const user = await DbUser.findOne({
      where: { id: userId },
      relations: ['userRoles'],
    })
    // user exists ?
    if (!user) {
      throw new LogError('Could not find user with given ID', userId)
    }
    // administrator user changes own role?
    const moderator = getUser(context)
    if (moderator.id === userId) {
      throw new LogError('Administrator can not change his own role')
    }
    // if user role(s) should be deleted by role=null as parameter
    if (role === null) {
      await deleteUserRole(user)
    } else if (isUserInRole(user, role)) {
      throw new LogError('User already has role=', role)
    } else {
      await setUserRole(user, role)
    }
    await EVENT_ADMIN_USER_ROLE_SET(user, moderator)
    const newUser = await DbUser.findOne({ where: { id: userId }, relations: ['userRoles'] })
    return newUser?.userRoles ? newUser.userRoles[0].role : null
  }

  @Authorized([RIGHTS.DELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async deleteUser(
    @Arg('userId', () => Int) userId: number,
    @Ctx() context: Context,
  ): Promise<Date | null> {
    const user = await DbUser.findOne({ where: { id: userId } })
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
    const newUser = await DbUser.findOne({ where: { id: userId }, withDeleted: true })
    return newUser ? newUser.deletedAt : null
  }

  @Authorized([RIGHTS.UNDELETE_USER])
  @Mutation(() => Date, { nullable: true })
  async unDeleteUser(
    @Arg('userId', () => Int) userId: number,
    @Ctx() context: Context,
  ): Promise<Date | null> {
    const user = await DbUser.findOne({ where: { id: userId }, withDeleted: true })
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
    const logger = createLogger()
    email = email.trim().toLowerCase()
    const user = await findUserByEmail(email)
    logger.addContext('user', user.id)
    logger.info('sendActivationEmail...')
    if (user.deletedAt || user.emailContact.deletedAt) {
      logger.warn('call for activation of deleted user')
      throw new Error('User with given email contact is deleted')
    }
    user.emailContact.emailResendCount++
    await user.emailContact.save()

    await sendAccountActivationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      language: user.language,
      activationLink: activationLink(user.emailContact.emailVerificationCode, logger),
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })

    await EVENT_EMAIL_ADMIN_CONFIRMATION(user, getUser(context))

    return true
  }

  @Authorized([RIGHTS.USER])
  @Query(() => User)
  async user(
    @Args()
    { identifier, communityIdentifier }: UserArgs,
  ): Promise<User> {
    // check if identifier contain community and user identifier
    if (identifier.includes('/')) {
      const parts = identifier.split('/')
      communityIdentifier = parts[0]
      identifier = parts[1]      
    }
    const foundDbUser = await findUserByIdentifier(identifier, communityIdentifier)
    if (!foundDbUser) {
      createLogger().debug('User not found', identifier, communityIdentifier)
      throw new Error('User not found')
    }
    return new User(foundDbUser)
  }

  // FIELD RESOLVERS
  @FieldResolver(() => UserContact)
  async emailContact(
    @Root() user: DbUser,
    @Ctx() context: Context,
    @Info() info: GraphQLResolveInfo,
  ): Promise<UserContact> {
    // Check if user has the necessary permissions to view user contact
    // Either they need VIEW_USER_CONTACT right, or they need VIEW_OWN_USER_CONTACT and must be viewing their own contact
    if (!context.role?.hasRight(RIGHTS.VIEW_USER_CONTACT)) {
      if (!context.role?.hasRight(RIGHTS.VIEW_OWN_USER_CONTACT) || context.user?.id !== user.id) {
        throw new LogError('User does not have permission to view this user contact', user.id)
      }
    }
    let userContact = user.emailContact
    if (!userContact) {
      const queryBuilder = DbUserContact.createQueryBuilder('userContact')
      queryBuilder.where('userContact.userId = :userId', { userId: user.id })
      extractGraphQLFieldsForSelect(info, queryBuilder, 'userContact')
      userContact = await queryBuilder.getOneOrFail()
    }
    return new UserContact(userContact)
  }
}

export async function findUserByEmail(email: string): Promise<DbUser> {
  try {
    const dbUser = await DbUser.findOneOrFail({
      where: {
        emailContact: { email },
      },
      withDeleted: true,
      relations: { userRoles: true, emailContact: true },
    })
    return dbUser
  } catch (e) {
    const logger = createLogger()
    if (e instanceof EntityNotFoundError || (e as Error).name === 'EntityNotFoundError') {
      logger.warn(`findUserByEmail failed, user with email=${email} not found`)
    } else {
      logger.error(`findUserByEmail failed, unknown error: ${e}`)
    }
    throw new Error('No user with this credentials')
  }
}

async function checkEmailExists(email: string): Promise<boolean> {
  const userContact = await DbUserContact.findOne({
    where: { email },
    withDeleted: true,
  })
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

export function isUserInRole(user: DbUser, role: string | null | undefined): boolean {
  if (user && role) {
    for (const userRole of user.userRoles) {
      if (userRole.role === role) {
        return true
      }
    }
  }
  return false
}
