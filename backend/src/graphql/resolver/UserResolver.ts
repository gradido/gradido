import { UserArgs } from '@arg//UserArgs'
import { CreateUserArgs } from '@arg/CreateUserArgs'
import { MEMBER_AVATARS_MAX_REFS, MemberAvatarsArgs } from '@arg/MemberAvatarsArgs'
import { Paginated } from '@arg/Paginated'
import { SearchUsersFilters } from '@arg/SearchUsersFilters'
import { SetUserRoleArgs } from '@arg/SetUserRoleArgs'
import { UnsecureLoginArgs } from '@arg/UnsecureLoginArgs'
import { UpdateUserInfosArgs } from '@arg/UpdateUserInfosArgs'
import { OptInType } from '@enum/OptInType'
import { Order } from '@enum/Order'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { PublishNameType } from '@enum/PublishNameType'
import { RoleNames } from '@enum/RoleNames'
import { UserContactType } from '@enum/UserContactType'
import { AdminUser, SearchAdminUsersResult } from '@model/AdminUser'
import { AliasStatus } from '@model/AliasStatus'
import { GmsUserAuthenticationResult } from '@model/GmsUserAuthenticationResult'
import { MemberAvatar } from '@model/MemberAvatar'
import { User } from '@model/User'
import { SearchUsersResult, UserAdmin } from '@model/UserAdmin'
import { UserContact } from '@model/UserContact'
import { UserLocationResult } from '@model/UserLocationResult'
import {
  delay,
  registerAddressTransaction,
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
  sendResetPasswordEmail,
  validateAlias,
} from 'core'
import {
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  type AliasOrigin,
  AppDatabase,
  aliasExists,
  aliasOriginIsSettled,
  ContributionLink as DbContributionLink,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  UserContact as DbUserContact,
  UserRole as DbUserRole,
  dbCountChosenAliasesSince,
  dbDeleteUserAvatar,
  dbEmailTaken,
  dbFindAliasesByUser,
  dbFindMemberAvatarsSmall,
  dbFindOldestChosenAliasSince,
  dbFindOwnAlias,
  dbFindProjectBrandingByAlias,
  dbFindProjectSpaceId,
  dbFindUserAvatarFull,
  dbFindUserAvatarSmall,
  dbInsertUserAlias,
  dbMarkAliasAdopted,
  dbPurgeExpiredEmailChanges,
  dbUpsertUserAvatar,
  findUserByIdentifier,
  getHomeCommunity,
  ProjectBrandingSelect,
  UserLoggingView,
} from 'database'
import { GraphQLResolveInfo } from 'graphql'
import { getLogger, Logger } from 'log4js'
import random from 'random-bigint'
import {
  ALIAS_QUOTA_PER_WINDOW,
  ALIAS_QUOTA_WINDOW_MS,
  AVATAR_FULL_MAX_BYTES,
  AVATAR_SMALL_MAX_BYTES,
  aliasCandidates,
  aliasSchema,
  JPEG_END_BYTES,
  JPEG_MAGIC_BYTES,
  pickFreeAlias,
  updateAllDefinedAndChanged,
} from 'shared'
import { randombytes_random } from 'sodium-native'
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
import { EntityNotFoundError, In, Not, Point } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { HumHubClient } from '@/apis/humhub/HumHubClient'
import { Account as HumhubAccount } from '@/apis/humhub/model/Account'
import { GetUser } from '@/apis/humhub/model/GetUser'
import { PostUser } from '@/apis/humhub/model/PostUser'
import { subscribe } from '@/apis/KlicktippController'
import { encode } from '@/auth/JWT'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  canEmailResend,
  emailChangeExpiryCutoff,
  isEmailVerificationCodeValid,
} from '@/data/EmailVerificationCode.logic'
import { PublishNameLogic } from '@/data/PublishName.logic'
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
import { Context, getClientTimezoneOffset, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { communityDbUser } from '@/util/communityUser'
import { hasElopageBuys } from '@/util/hasElopageBuys'
import { durationInMinutesFromDates, getTimeDurationObject, printTimeDuration } from '@/util/time'
import { authenticateGmsUserPlayground } from './util/authenticateGmsUserPlayground'
import { compareGmsRelevantUserSettings } from './util/compareGmsRelevantUserSettings'
import { getFullUserCreation, getUserCreations } from './util/creations'
import { extractGraphQLFieldsForSelect } from './util/extractGraphQLFields'
import { findUsers } from './util/findUsers'
import { getKlicktippState } from './util/getKlicktippState'
import { Location2Point, Point2Location } from './util/Location2Point'
import { describeModeratorCreationGroups } from './util/moderatorCreationGroupScope'
import { deleteUserRole, setUserRole } from './util/modifyUserRole'
import { sendUsersToGms } from './util/sendUserToGms'
import { syncHumhub } from './util/syncHumhub'
import { removeUserFromGms } from './util/syncMatchingEntryToGms'

const LANGUAGES = ['de', 'en', 'es', 'fr', 'nl', 'it', 'tr', 'ru', 'pt', 'el']
const DEFAULT_LANGUAGE = 'de'
const db = AppDatabase.getInstance()
const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.UserResolver.${method}`)
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
    const logger = createLogger('verifyLogin')
    logger.info('verifyLogin...')
    // TODO refactor and do not have duplicate code with login(see below)
    const userEntity = getUser(context)
    logger.addContext('user', userEntity.id)
    const user = new User(userEntity)
    // Group functions: hand the admin interface the moderator's visibility scope
    // so its group filter can offer only the groups they may work in. Loaded from the role
    // directly (like loadModeratorScope), so it does not depend on how the context happened
    // to load the user's roles. Same derivation as the community info page.
    const role = await DbUserRole.findOne({ where: { userId: userEntity.id } })
    const moderatorCreationGroups = describeModeratorCreationGroups(role)
    user.visibleCreationGroups = moderatorCreationGroups.tags
    user.seesAllCreationGroups = moderatorCreationGroups.seesAllCreationGroups
    user.seesUntagged = moderatorCreationGroups.seesUntagged
    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage(context)

    // The member's own profile picture. Sent along with the login so the wallet can show
    // it immediately instead of jumping from initials to picture on every page load.
    const avatar = await dbFindUserAvatarSmall(userEntity.id)
    user.avatar = avatar.success ? avatar.value.toString('base64') : null

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
    const logger = createLogger('login')
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
    let projectBrandingSpaceIdPromise: Promise<number | null | undefined> | undefined
    const klicktippStatePromise = getKlicktippState(dbUser.emailContact.email)
    if (CONFIG.HUMHUB_ACTIVE && dbUser.humhubAllowed) {
      const getHumhubUser = new PostUser(dbUser)
      humhubUserPromise = HumHubClient.getInstance()?.userByUsernameAsync(
        getHumhubUser.account.username,
      )
    }
    if (project) {
      projectBrandingSpaceIdPromise = dbFindProjectSpaceId(project)
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
    const projectBrandingSpaceId = await projectBrandingSpaceIdPromise
    logger.debug('project branding: ', projectBrandingSpaceId)
    // load humhub state
    if (humhubUserPromise) {
      try {
        const result = await humhubUserPromise
        user.humhubAllowed = result?.result?.account.status === 1
        if (user.humhubAllowed && result?.result?.account?.username) {
          await syncHumhub(null, dbUser, result.result.account.username, projectBrandingSpaceId)
        }
      } catch (e) {
        logger.error("couldn't reach out to humhub, disable for now", e)
        user.humhubAllowed = false
      }
    }
    user.klickTipp = await klicktippStatePromise
    // Login runs on an inalienable right, so no authenticated caller exists while this
    // answer is serialised -- but the member HAS just proven who they are. Without this
    // line the firstName/lastName field resolvers would read the owner exception as
    // "not you" and the wallet's own store would fill with null names.
    context.user = dbUser
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
    const logger = createLogger('createUser')
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
    let projectBrandingPromise: Promise<ProjectBrandingSelect | undefined> | undefined
    if (project) {
      projectBrandingPromise = dbFindProjectBrandingByAlias(project)
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
      throw new Error(
        `Error creating user, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`,
      )
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

    if (logger.isDebugEnabled()) {
      logger.debug('new dbUser', new UserLoggingView(dbUser))
    }
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
    let projectBranding: ProjectBrandingSelect | undefined
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
      dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
        throw new LogError('Error while updating dbUser', error)
      })

      // Everybody holds a name from here on. Migration 0116 covers the members who
      // existed when it ran; without this, every account opened after it would carry
      // none again - and since a transaction stores `sender.alias`, their rows would
      // have nothing where a name belongs.
      //
      // A name the system builds is a proposal: it is reserved for them and can be
      // taken back, but it costs none of their four picks until they adopt it.
      let aliasOrigin: AliasOrigin = ALIAS_ORIGIN_CHOSEN
      if (!dbUser.alias) {
        aliasOrigin = ALIAS_ORIGIN_ASSIGNED
        dbUser.alias = await pickFreeAlias(
          aliasCandidates(dbUser.firstName, dbUser.lastName, email),
          dbUser.id,
          aliasExists,
        )
        // The ladder decides what to offer, the schema decides what may be written.
        aliasSchema.parse(dbUser.alias)
        dbUser = await queryRunner.manager.save(dbUser).catch((error) => {
          throw new LogError('Error while storing the generated alias', error)
        })
      }
      await dbInsertUserAlias(
        dbUser.id,
        dbUser.alias,
        dbUser.communityUuid,
        aliasOrigin,
        queryRunner.manager,
      )

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
    // register user into blockchain
    const dltTransactionPromise = registerAddressTransaction(dbUser, homeCom)
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
          await sendUsersToGms([dbUser], homeCom)
        }
      } catch (err) {
        if (CONFIG.GMS_CREATE_USER_THROW_ERRORS) {
          throw new LogError('Error publishing new created user to GMS:', err)
        } else {
          logger.error('Error publishing new created user to GMS:', err)
        }
      }
    }
    // wait for finishing dlt transaction
    const startTime = new Date()
    await dltTransactionPromise
    const endTime = new Date()
    logger.info(
      `dlt-connector register address finished in ${endTime.getTime() - startTime.getTime()} ms`,
    )
    return new User(dbUser)
  }

  @Authorized([RIGHTS.SEND_RESET_PASSWORD_EMAIL])
  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string): Promise<boolean> {
    const logger = createLogger('forgotPassword')
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
    const logger = createLogger('setPassword')
    logger.info(`setPassword...`)
    // Validate Password
    if (!isValidPassword(password)) {
      throw new LogError(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }
    // load code
    // A pending e-mail change carries a code of the same kind, but that code confirms an
    // address - it must not log anybody in. Its row is excluded here by its opt-in type.
    const userContact = await DbUserContact.findOneOrFail({
      where: { emailVerificationCode: code, emailOptInTypeId: Not(OptInType.EMAIL_OPT_IN_CHANGE) },
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
    const logger = createLogger('queryOptIn')
    logger.addContext('optIn', optIn.substring(0, 4))
    logger.info(`queryOptIn...`)
    const userContact = await DbUserContact.findOneOrFail({
      where: { emailVerificationCode: optIn },
    })
    // Same exclusion as in `setPassword`: a change code answers nothing here - and it
    // answers it exactly the way an unknown code does.
    if (userContact.emailOptInTypeId === OptInType.EMAIL_OPT_IN_CHANGE) {
      throw new EntityNotFoundError(DbUserContact, { where: { emailVerificationCode: optIn } })
    }
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
  async checkUsername(
    @Arg('username') username: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    try {
      const user = getUser(context)
      await validateAlias(username, user?.id)
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
      avatarVisibleToMembers,
      gmsPublishName,
      humhubPublishName,
      gmsLocation,
      gmsPublishLocation,
      aboutMe,
    } = updateUserInfosArgs
    let user = getUser(context)
    const logger = createLogger('updateUserInfos')
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
      avatarVisibleToMembers: avatarVisibleToMembers !== undefined,
      gmsPublishName: gmsPublishName !== undefined,
      humhubPublishName: humhubPublishName !== undefined,
      gmsLocation: gmsLocation !== undefined,
      gmsPublishLocation: gmsPublishLocation !== undefined,
      aboutMe: aboutMe !== undefined,
    })

    const updateUserInGMS = compareGmsRelevantUserSettings(user, updateUserInfosArgs)
    // Read before the update overwrites it: gmsAllowed going true -> false is the
    // member leaving the GMS. compareGmsRelevantUserSettings only reports the way
    // in (it checks `updateUserInfosArgs.gmsAllowed &&`), which is precisely why
    // leaving never reached the GMS. Kept next to the gmsRegistered check below
    // rather than replaced by it: a member whose publish failed on the way in is
    // not marked as registered, and their copy may still have landed over there.
    const gmsConsentWithdrawn = user.gmsAllowed && updateUserInfosArgs.gmsAllowed === false
    const publishNameLogic = new PublishNameLogic(user)
    const oldHumhubUsername = publishNameLogic.getUserIdentifier(
      user.humhubPublishName as PublishNameType,
    )
    const queryRunner = db.getDataSource().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    // Everything from here on runs inside the transaction that was just opened, and
    // that is the point: before, only the save was guarded, so a rejected alias, an
    // exhausted quota, a bad password or an unsupported language left the connection
    // open with a REPEATABLE READ transaction still running on it.
    try {
      let updated = updateAllDefinedAndChanged(user, {
        firstName,
        lastName,
        hideAmountGDD,
        hideAmountGDT,
        humhubAllowed,
        gmsAllowed,
        avatarVisibleToMembers,
        gmsPublishName: gmsPublishName?.valueOf(),
        humhubPublishName: humhubPublishName?.valueOf(),
        gmsPublishLocation: gmsPublishLocation?.valueOf(),
        aboutMe,
      })
      // Taking a name inserts a row and moves the marker; reclaiming one the member
      // already owns only moves the marker. Leaving a name writes nothing - its row is
      // already there. That is why the number of picked rows in a year is exactly how
      // often somebody chose, and why coming back to an earlier name is free.
      if (alias && alias !== user.alias) {
        await validateAlias(alias, user.id)
        const communityUuid = user.communityUuid
        const ownAlready = await dbFindOwnAlias(user.id, alias, communityUuid, queryRunner.manager)
        if (!ownAlready) {
          const since = new Date(Date.now() - ALIAS_QUOTA_WINDOW_MS)
          const picked = await dbCountChosenAliasesSince(user.id, since, queryRunner.manager)
          if (picked >= ALIAS_QUOTA_PER_WINDOW) {
            logger.warn('alias quota exhausted', picked)
            throw new LogError('ALIAS_QUOTA_EXHAUSTED')
          }
          await dbInsertUserAlias(
            user.id,
            alias,
            communityUuid,
            ALIAS_ORIGIN_CHOSEN,
            queryRunner.manager,
          )
          logger.debug('member took a new alias')
        } else {
          logger.debug('member reclaimed an alias they already owned')
        }
        user.alias = alias
        updated = true
      }

      if (language) {
        if (!isLanguage(language)) {
          logger.warn('try to set unsupported language', language)
          throw new LogError('Given language is not a valid language or not supported')
        }
        user.language = language
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

      // early exit if no update was made. Nothing was written, but the transaction is
      // open all the same and has to be closed before returning - and this is the most
      // travelled way out of the whole resolver, so a bare `return` here leaked a
      // connection on every call that changed nothing.
      if (!updated) {
        await queryRunner.rollbackTransaction()
        return true
      }

      try {
        user = await queryRunner.manager.save(user).catch((error) => {
          throw new LogError('Error while saving user', error)
        })
        await queryRunner.commitTransaction()
        logger.addContext('user', user.id)
      } catch (err) {
        const errorMessage = 'Error saving user'
        logger.error(errorMessage, err)
        throw new Error(errorMessage)
      }
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      // Passed on unchanged. The wallet reads ALIAS_QUOTA_EXHAUSTED off the message to
      // name a date instead of showing a bare code, so flattening these into one
      // message here would take that away.
      throw err
    } finally {
      await queryRunner.release()
    }
    logger.info('updateUserInfos() successfully finished...')
    logger.debug('writing User data successful...', new UserLoggingView(user))
    await EVENT_USER_INFO_UPDATE(user)

    // validate if user settings are changed with relevance to update gms-user
    try {
      if (CONFIG.GMS_ACTIVE && !user.gmsAllowed && (gmsConsentWithdrawn || user.gmsRegistered)) {
        // The member does not take part, and the GMS may hold them anyway: they just
        // left, or a copy was made of them that never should have been. Deleting over
        // there is idempotent, so doing it once too often costs one request, while
        // doing it once too rarely leaves them findable by name and on the map.
        logger.debug(`member does not take part in the gms, delete user in gms...`)
        await removeUserFromGms(user)
      } else if (CONFIG.GMS_ACTIVE && updateUserInGMS && user.gmsAllowed) {
        logger.debug(`changed user-settings relevant for gms-user update...`)
        const homeCom = await getHomeCommunity()
        if (!homeCom) {
          logger.error('no home community found, please start the dht-node first')
          throw new Error(
            `Error updating user, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`,
          )
        }
        if (homeCom.gmsApiKey !== null) {
          logger.debug(`send User to Gms...`)
          // A member the GMS does not hold is built there from scratch, so their live
          // entries have to travel with them - withdrawing consent removes the member
          // and everything of theirs, and this is what brings the entries back when
          // they join again. For a member the GMS already holds, sending the settings
          // alone is enough and leaves their entries untouched.
          await sendUsersToGms([user], homeCom, !user.gmsRegistered)
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

  /**
   * Sets the member's own profile picture.
   *
   * Deliberately its own mutation rather than another field on updateUserInfos: that one
   * carries fifteen settings and runs compareGmsRelevantUserSettings, which starts a GMS
   * and HumHub sync when something relevant changed. A picture has nothing to say to
   * either system, and every change of it would set both in motion.
   *
   * Both arguments are base64 without a data URI prefix, and both come from the same
   * crop: the browser draws the visible square twice, at 128 and at 512. They arrive
   * together because they belong together — storing one without the other would leave
   * the member with two pictures that disagree depending on where they are looked at.
   *
   * The checks here are the backstop for a client that did neither the cropping nor the
   * step-down; see AVATAR_FULL_MAX_BYTES in `shared` for why the two limits share a
   * budget.
   */
  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async setUserAvatar(
    @Arg('avatarSmall') avatarSmall: string,
    @Arg('avatarFull') avatarFull: string,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const user = getUser(context)
    const logger = createLogger('setUserAvatar')
    logger.addContext('user', user.id)

    const small = this.decodeAvatar(avatarSmall, 'small', AVATAR_SMALL_MAX_BYTES)
    const full = this.decodeAvatar(avatarFull, 'full', AVATAR_FULL_MAX_BYTES)
    logger.info(`setUserAvatar... ${small.length} + ${full.length} bytes`)

    const stored = await dbUpsertUserAvatar({
      userId: user.id,
      avatarSmall: small,
      avatarFull: full,
      mimeType: 'image/jpeg',
    })
    if (!stored.success) {
      throw new LogError('Error storing avatar image')
    }

    logger.debug('setUserAvatar... successful')
    return true
  }

  /**
   * Decodes and checks one rendition. Named in the error so a member over budget learns
   * WHICH picture was refused — with two of them in one request, "too large" on its own
   * sends whoever reads it looking in the wrong place.
   */
  private decodeAvatar(image: string, which: string, maxBytes: number): Buffer {
    const bytes = Buffer.from(image, 'base64')

    if (bytes.length === 0) {
      throw new LogError(`Avatar image (${which}) is empty`)
    }
    if (bytes.length > maxBytes) {
      throw new LogError(`Avatar image (${which}) too large`, {
        bytes: bytes.length,
        max: maxBytes,
      })
    }
    // Buffer.from ignores anything it cannot decode instead of failing, so "it decoded"
    // says nothing about what arrived. The markers do.
    //
    // Both ends, not just the start: on the opening marker alone a three-byte payload of
    // ff d8 00 passes, so the column would take arbitrary data from anyone willing to
    // prefix it. This is still not format validation -- only a decoder could say whether
    // what lies between is a picture -- and a decoder is what this design keeps out of
    // the backend on purpose.
    const startsRight = bytes[0] === JPEG_MAGIC_BYTES[0] && bytes[1] === JPEG_MAGIC_BYTES[1]
    const endsRight =
      bytes[bytes.length - 2] === JPEG_END_BYTES[0] && bytes[bytes.length - 1] === JPEG_END_BYTES[1]
    if (!startsRight || !endsRight) {
      throw new LogError(`Avatar image (${which}) is not a JPEG`)
    }

    return bytes
  }

  /**
   * The member's own full-size picture, on demand. Kept out of verifyLogin deliberately:
   * it is roughly ten times the everyday rendition and is wanted at two moments only —
   * printing the member card, and looking at one's own picture — so the common paths
   * should not carry it.
   *
   * ⛔ Own view only, and structurally so: it reads the id from the context and takes no
   * argument, so there is no user to ask about but oneself. That is a stronger guarantee
   * than a guard on a parameter, which the next caller can get wrong.
   */
  @Authorized([RIGHTS.VERIFY_LOGIN])
  @Query(() => String, { nullable: true })
  async avatarFull(@Ctx() context: Context): Promise<string | null> {
    const user = getUser(context)
    const avatar = await dbFindUserAvatarFull(user.id)
    return avatar.success ? avatar.value.toString('base64') : null
  }

  /**
   * The pictures of several other members at once, for showing them next to the bookings
   * the caller shares with them.
   *
   * ★ The caller ASKS for these; nothing pushes them. A booking list carries only a date
   * per member (User.avatarUpdatedAt), so the wallet can work out which pictures it does
   * not already hold and ask for exactly those. On a second visit that is usually none.
   *
   * ⛔ The disclosure rule is not here. Whether a member's face may be shown to other
   * members lives in the query (dbFindMemberAvatarsSmall) so that no reader can forget
   * it -- this resolver could not hand out a hidden picture even if it tried.
   *
   * A member who has nothing to show is simply absent from the answer, never an error.
   * See MemberAvatar for why that is the smaller surface.
   */
  @Authorized([RIGHTS.VERIFY_LOGIN])
  @Query(() => [MemberAvatar])
  async memberAvatars(
    @Args(() => MemberAvatarsArgs) { refs }: MemberAvatarsArgs,
  ): Promise<MemberAvatar[]> {
    // A cap, because without one this is a bulk download of every face in the community.
    // Sized as one page of bookings plus room for a list that happens to name a different
    // member in every row; a wallet that needs more asks twice.
    if (refs.length > MEMBER_AVATARS_MAX_REFS) {
      throw new LogError('Too many members requested at once', refs.length)
    }

    const rows = await dbFindMemberAvatarsSmall(refs.map((ref) => ref.gradidoID))
    return rows.map((row) => {
      const avatar = new MemberAvatar()
      avatar.gradidoID = row.gradidoId
      avatar.communityUuid = row.communityUuid
      avatar.avatar = row.avatarSmall.toString('base64')
      avatar.avatarUpdatedAt = row.updatedAt
      return avatar
    })
  }

  /**
   * Removes the member's own profile picture. Removing one that is not there is not an
   * error worth raising — the member wanted it gone, and it is gone.
   */
  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async removeUserAvatar(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    const logger = createLogger('removeUserAvatar')
    logger.addContext('user', user.id)
    logger.info('removeUserAvatar...')

    await dbDeleteUserAvatar(user.id)
    return true
  }

  @Authorized([RIGHTS.HAS_ELOPAGE])
  @Query(() => Boolean)
  async hasElopage(@Ctx() context: Context): Promise<boolean> {
    const dbUser = getUser(context)
    const logger = createLogger('hasElopage')
    logger.addContext('user', dbUser.id)
    const elopageBuys = await hasElopageBuys(dbUser.id)
    logger.info(`has Elopage (ablify): ${elopageBuys}`)
    return elopageBuys
  }

  /**
   * Asked before the member types anything, so the page can name a date on a disabled
   * button instead of letting somebody choose a name and then refusing it - and so the
   * confirmation can say what a change will cost before it happens.
   */
  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Query(() => AliasStatus)
  async aliasStatus(@Ctx() context: Context): Promise<AliasStatus> {
    const user = getUser(context)
    const since = new Date(Date.now() - ALIAS_QUOTA_WINDOW_MS)
    const picked = await dbCountChosenAliasesSince(user.id, since)
    const owned = await dbFindAliasesByUser(user.id)

    const status = new AliasStatus()
    status.changesLeft = Math.max(0, ALIAS_QUOTA_PER_WINDOW - picked)
    status.ownAliases = owned.map((row) => row.alias)
    // Compared without regard to case, because the column is utf8mb4_unicode_ci and so
    // is every lookup that writes it. A member who only changes the capitalisation of
    // their own name keeps the very same row - a `===` here would stop finding it and
    // put them back in front of the first-login window with no way out: keeping the
    // name reports "already settled" without changing anything, so the window would
    // return on every page mount until they spent one of their four picks.
    const current = user.alias?.toLowerCase()
    status.aliasSettled = owned.some(
      (row) => row.alias.toLowerCase() === current && aliasOriginIsSettled(row.origin),
    )
    status.nextChangeAt = null
    if (status.changesLeft === 0) {
      // The window rolls, so it is the oldest pick still inside it that frees the next
      // slot - a year after it was made, not a year from today.
      const oldest = await dbFindOldestChosenAliasSince(user.id, since)
      if (oldest) {
        status.nextChangeAt = new Date(oldest.createdAt.getTime() + ALIAS_QUOTA_WINDOW_MS)
      }
    }
    return status
  }

  /**
   * "Passt so" at first login: the member keeps the name the system built for them, and
   * Nothing about the name changes - only that the question has been answered, which
   * is what stops the window coming back.
   *
   * It costs none of the four. The member did not pick this name, they only let it
   * stand, and charging a quarter of the yearly quota for that would be a price for
   * something that is barely an act (NU-010/011). That is why the row becomes
   * `adopted` and not `chosen`.
   */
  @Authorized([RIGHTS.UPDATE_USER_INFOS])
  @Mutation(() => Boolean)
  async adoptAlias(@Ctx() context: Context): Promise<boolean> {
    const user = getUser(context)
    const logger = createLogger('adoptAlias')
    logger.addContext('user', user.id)

    const row = await dbFindOwnAlias(user.id, user.alias, user.communityUuid)
    if (!row) {
      logger.warn('no row for the alias the member holds')
      throw new LogError('ALIAS_NOT_FOUND')
    }
    if (aliasOriginIsSettled(row.origin)) {
      // Already answered - saying so twice is not an error, it just does nothing,
      // which keeps a double click from becoming a failure.
      return true
    }
    await dbMarkAliasAdopted(row.id)
    logger.info('member kept the name they were given')
    return true
  }

  @Authorized([RIGHTS.GMS_USER_PLAYGROUND])
  @Query(() => GmsUserAuthenticationResult)
  async authenticateGmsUserSearch(@Ctx() context: Context): Promise<GmsUserAuthenticationResult> {
    const dbUser = getUser(context)
    const logger = createLogger('authenticateGmsUserSearch')
    logger.addContext('user', dbUser.id)
    logger.info(`authenticateGmsUserSearch()...`)

    let result = new GmsUserAuthenticationResult()
    if (context.token) {
      const homeCom = await getHomeCommunity()
      if (!homeCom) {
        logger.error(
          "couldn't authenticate for gms, no home community found, please start the dht-node first",
        )
        throw new Error(
          `Error authenticating for gms, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`,
        )
      }
      if (!homeCom.gmsApiKey) {
        throw new LogError('authenticateGmsUserSearch missing HomeCommunity GmsApiKey')
      }
      result = await authenticateGmsUserPlayground(homeCom.gmsApiKey, dbUser)
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
    const logger = createLogger('userLocation')
    logger.addContext('user', dbUser.id)
    logger.info(`userLocation()...`)

    const result = new UserLocationResult()
    if (context.token) {
      const homeCom = await getHomeCommunity()
      if (!homeCom) {
        logger.error(
          "couldn't load home community location, no home community found, please start the dht-node first",
        )
        throw new Error(
          `Error loading user location, please write the support team: ${CONFIG.COMMUNITY_SUPPORT_MAIL}`,
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
    const logger = createLogger('authenticateHumhubAutoLogin')
    logger.addContext('user', dbUser.id)
    logger.info(`authenticateHumhubAutoLogin()...`)

    const humhubClient = HumHubClient.getInstance()
    if (!humhubClient) {
      throw new LogError('cannot create humhub client')
    }
    // should rarely happen, so we don't optimize for parallel processing
    if (!dbUser.humhubAllowed && project) {
      if (!(await dbFindProjectBrandingByAlias(project))) {
        throw new LogError(`project branding with alias: ${project} not found`)
      }
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
    // MODERATOR_AI belongs here too: a KI-Moderator is a moderator who may additionally use
    // Crea, so leaving the role out would drop real moderators from the community info page
    // and leave their groups without a contact.
    const [users, count] = await DbUser.findAndCount({
      relations: ['userRoles'],
      where: {
        userRoles: { role: In([RoleNames.ADMIN, RoleNames.MODERATOR, RoleNames.MODERATOR_AI]) },
      },
      order: {
        createdAt: order,
      },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    })
    return {
      userCount: count,
      userList: users.map((user) => new AdminUser(user)),
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
    const userFields = [
      'id',
      'firstName',
      'lastName',
      'emailId',
      'emailContact',
      'deletedAt',
      'createdAt',
    ]
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
          userCreations ? userCreations.creations : getFullUserCreation(),
          await hasElopageBuys(user.id),
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
    const logger = createLogger('sendActivationEmail')
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
      createLogger('user').debug('User not found', identifier, communityIdentifier)
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

  /**
   * The salutation is what the moderation noted about a person (E-013), not the person's
   * own data - and this ObjectType is shared with the wallet, which reaches it through
   * `user()`, through `transactionList { linkedUser }` and, with no token at all, through
   * `queryTransactionLink { senderUser }`. So it is guarded here, like emailContact.
   *
   * Returns null instead of throwing: the field is nullable by nature ("none set"), a
   * caller without the right should simply see nothing, and an error here would null the
   * whole enclosing user for a query that merely asked for too much.
   */
  @FieldResolver(() => String, { nullable: true })
  salutation(@Root() user: User, @Ctx() context: Context): string | null {
    if (!context.role?.hasRight(RIGHTS.VIEW_USER_SALUTATION)) {
      return null
    }
    return user.salutation ?? null
  }

  /**
   * The member's real first name -- moderation and the member themselves, everyone else
   * reads null and speaks of the member by alias (NU-019). Guarded here for the same
   * reason as salutation: this ObjectType leaves through `user()` (any signed-in member,
   * any identifier), `transactionList { linkedUser }`, and `queryTransactionLink
   * { senderUser }` with no token at all. Without this resolver every display fix is one
   * query away from being undone.
   *
   * The owner exception is spelled out (context.user), NOT modelled as a second right:
   * VIEW_OWN_USER_CONTACT next door is assigned to no role and guards nothing -- that
   * construction is the one this deliberately avoids. The login mutation sets
   * context.user to the member it just authenticated, so the wallet's login answer
   * carries the member's own name.
   *
   * Null instead of throwing, like salutation: an error here would null the whole
   * enclosing user for a query that merely asked for too much.
   */
  @FieldResolver(() => String, { nullable: true })
  firstName(@Root() user: User, @Ctx() context: Context): string | null {
    if (context.role?.hasRight(RIGHTS.VIEW_USER_REAL_NAME)) {
      return user.firstName ?? null
    }
    if (context.user && context.user.id === user.id) {
      return user.firstName ?? null
    }
    return null
  }

  /** The other half of the name; same guard as firstName above. */
  @FieldResolver(() => String, { nullable: true })
  lastName(@Root() user: User, @Ctx() context: Context): string | null {
    if (context.role?.hasRight(RIGHTS.VIEW_USER_REAL_NAME)) {
      return user.lastName ?? null
    }
    if (context.user && context.user.id === user.id) {
      return user.lastName ?? null
    }
    return null
  }

  /**
   * A member's own words about themselves. Guarded for the same reason as salutation:
   * this ObjectType is shared, and `user()` hands out any member by alias to anyone
   * logged in, while `queryTransactionLink { senderUser }` needs no token at all.
   *
   * Own text only. Nobody else needs it from here — the wallet reads it through
   * `verifyLogin` to fill the member's own form, and the text of OTHER people arrives
   * with a match, from the GMS, which only holds it for members who allowed it
   * (`gmsAllowed`). Handing it out here would publish the text of members who
   * deliberately did not.
   *
   * Returns null rather than throwing, like salutation: a caller without the right
   * should see nothing, not lose the whole enclosing user.
   */
  @FieldResolver(() => String, { nullable: true })
  aboutMe(@Root() user: User, @Ctx() context: Context): string | null {
    if (context.user?.id !== user.id) {
      return null
    }
    return user.aboutMe ?? null
  }

  /**
   * The avatar THROUGH THIS FIELD is own-view only, like aboutMe above, and for a stronger
   * reason: showing a face to other members is a disclosure to third parties, and this
   * house gives every such disclosure its own switch. That switch is avatarVisibleToMembers
   * below.
   *
   * ⚠️ The switch IS read now, and the small rendition does reach other members -- through
   * the memberAvatars query, over dbFindMemberAvatarsSmall, which applies
   * mayBeShownToMembers() in the query itself. That path was ADDED beside this guard, and
   * this guard stayed exactly as it was, which is the whole point: it is what keeps rows
   * whose owner could not possibly have set the switch from reading as consent HERE, on a
   * User handed out by name lookups and by link queries that need no token at all.
   *
   * Whoever changes that must ADD the setting to the test below, never replace it. Rows
   * whose owner could not possibly have set it carry the column default, which is
   * "visible": members of a foreign community stored by the federation, the synthetic
   * community user, and anyone deleted before the column existed. The owner test is what
   * keeps those from reading as consent.
   *
   * Today nothing would leak without this guard either - only verifyLogin fills the
   * field, so `user` hands out a User whose avatar is null anyway. That is exactly why
   * the guard is here: a property that holds only because no other code path happens to
   * set the field is not a rule, it is an accident, and the next person to fill it
   * somewhere else would open the door without noticing.
   */
  @FieldResolver(() => String, { nullable: true })
  avatar(@Root() user: User, @Ctx() context: Context): string | null {
    if (context.user?.id !== user.id) {
      return null
    }
    return user.avatar ?? null
  }

  /**
   * The switch that belongs to the avatar above, and guarded like it. Whether a member
   * shows their face is a decision about themselves, and what they decided is no more
   * anybody else's business than the face: `user` hands out any member by alias to
   * everyone logged in, and `queryTransactionLink { senderUser }` needs no token at all.
   *
   * Nothing is given up by this. The deliveries that put a face next to a booking read
   * the setting HERE, in the backend, where they decide whether to send the picture at
   * all - no client ever has to be told about somebody else's switch.
   */
  @FieldResolver(() => Boolean, { nullable: true })
  avatarVisibleToMembers(@Root() user: User, @Ctx() context: Context): boolean | null {
    if (context.user?.id !== user.id) {
      return null
    }
    return user.avatarVisibleToMembers ?? null
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
    const logger = createLogger('findUserByEmail')
    if (e instanceof EntityNotFoundError || (e as Error).name === 'EntityNotFoundError') {
      logger.warn(`findUserByEmail failed, user with email=${email} not found`)
    } else {
      logger.error(`findUserByEmail failed, unknown error: ${e}`)
    }
    throw new Error('No user with this credentials')
  }
}

async function checkEmailExists(email: string): Promise<boolean> {
  // A pending e-mail change that ran past its window must not keep the address it wanted
  // away from whoever registers with it now - clear it first, then ask.
  await dbPurgeExpiredEmailChanges(emailChangeExpiryCutoff(), email)
  return dbEmailTaken(email)
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
