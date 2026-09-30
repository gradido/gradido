import { OptInType } from '@enum/OptInType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { UserContactType } from '@enum/UserContactType'
import {
  registerAddressTransaction,
  sendAccountActivationEmail,
  sendAccountMultiRegistrationEmail,
} from 'core'
import {
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  type AliasOrigin,
  DBDuplicateEntryError,
  DbUser,
  DrizzleTransaction,
  dbFindUserAliasesExisting,
  dbFindUserByEmail,
  dbFindUserWithContactById,
  dbHomeCommunityGetUuid,
  dbInsertEvent,
  dbInsertUser,
  dbInsertUserAlias,
  dbInsertUserContact,
  dbIsUserContactFieldExist,
  dbLocalUserGradidoIdExist,
  dbReleaseUnconfirmedEmailChangeFor,
  dbRemoveUser,
  dbRemoveUserAlias,
  dbRemoveUserContact,
  dbUserUpdateField,
  EventType,
  getHomeCommunityDrizzle,
  UserContactInsert,
  UserInsert,
  UserSelect,
} from 'database'
import { Logger } from 'log4js'
import random from 'random-bigint'
import {
  aliasCandidates,
  aliasVariants,
  findFirstFreeAlias,
  primaryAliasCandidate,
  Result,
} from 'shared'
import { randombytes_random } from 'sodium-native'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { syncHumhub } from '@/graphql/resolver/util/syncHumhub'
import { getTimeDurationObject } from '@/util/time'
import { AbstractRegisterUserRole } from './AbstractRegisterUser.role'
import { CreateUser } from './createUser.schema'
import { RegisterUserDuplicateError } from './errorTypes'

/**
 * The plain registration, and the flow every variant builds on: the account has no
 * password yet, and the activation mail carries the set-password link. The variants
 * (project, redeem code, referrer, table code) override single steps of it.
 *
 * An address that is taken answers here too, like a new account: the owner gets the
 * multi-registration mail, and nothing is opened.
 *
 * The input comes parsed by createUserSchema: email trimmed and lowercased, language
 * defaulted. A password is used only by the table code (RegisterUserCardRole).
 */

export class RegisterUserRole<
  T extends CreateUser = CreateUser,
> extends AbstractRegisterUserRole<T> {
  protected userId: number | null = null
  protected userContactId: number | null = null
  protected userAliasId: number | null = null
  protected emailVerificationCode: bigint | null = null

  // remove already created db entries
  public async rollback(): Promise<number[]> {
    const dbCalls: Promise<number>[] = []
    if (this.userId) {
      dbCalls.push(dbRemoveUser(this.userId))
    }
    if (this.userContactId) {
      dbCalls.push(dbRemoveUserContact(this.userContactId))
    }
    if (this.userAliasId) {
      dbCalls.push(dbRemoveUserAlias(this.userAliasId))
    }
    return Promise.all(dbCalls)
  }

  public async prepareUser(): Promise<UserInsert> {
    const { firstName, lastName, language, publisherId } = this.user
    return {
      gradidoId: uuidv4(),
      communityUuid: await dbHomeCommunityGetUuid(),
      firstName,
      lastName,
      passwordEncryptionType: PasswordEncryptionType.NO_PASSWORD,
      language,
      publisherId,
      // enable humhub from now on for new user
      humhubAllowed: true,
    }
  }

  public prepareUserContact(): UserContactInsert {
    if (!this.userId) {
      throw new Error('Missing user id')
    }
    this.emailVerificationCode = random(64)
    return {
      email: this.user.email,
      userId: this.userId,
      type: UserContactType.USER_CONTACT_EMAIL,
      emailChecked: false,
      emailOptInTypeId: OptInType.EMAIL_OPT_IN_REGISTER,
      emailVerificationCode: this.emailVerificationCode,
    }
  }

  // store user and user contact into db, not a transaction so the next count (dbCountUnconfirmedVouchedAccounts) is already aware of our new user
  public async storeUserAndUserContact(
    dbUser: UserInsert,
    logger: Logger,
    tx?: DrizzleTransaction,
  ): Promise<Result<number, RegisterUserDuplicateError>> {
    // write user
    let insertUserResult = await dbInsertUser(dbUser, tx)
    // maybe gradido uuid collided? Shouldn't happen nearly never, so let's try one time again
    if (!insertUserResult.success) {
      dbUser.gradidoId = uuidv4()
      insertUserResult = await dbInsertUser(dbUser, tx)
    }
    if (!insertUserResult.success) {
      const isGradidoIdExist = await dbLocalUserGradidoIdExist(dbUser.gradidoId, tx)
      if (isGradidoIdExist) {
        logger.error(
          'uuidv4 generator seems broken, generate a already existing uuidv4 two times in a row',
        )
      } else {
        logger.error("couldn't insert user, gradido id is unique")
      }
      throw new Error('Error while saving dbUser')
    }
    this.userId = insertUserResult.value

    // write user contact
    let userContact = this.prepareUserContact()
    let insertUserContactResult = await dbInsertUserContact(userContact, tx)
    if (!insertUserContactResult.success) {
      const existingUser = await dbFindUserByEmail(this.user.email, tx)
      if (existingUser) {
        await dbRemoveUser(this.userId, tx)
        return { success: false, error: new RegisterUserDuplicateError(existingUser) }
      }
      // Somebody's change typed this address in and was never confirmed. That claim yields to a
      // registration, which will have to answer mail at the address (see
      // dbReleaseUnconfirmedEmailChangeFor) - released, and the contact written once more.
      if (await dbReleaseUnconfirmedEmailChangeFor(this.user.email, tx)) {
        insertUserContactResult = await dbInsertUserContact(userContact, tx)
      } else if (
        await dbIsUserContactFieldExist(
          'emailVerificationCode',
          userContact.emailVerificationCode,
          tx,
        )
      ) {
        // email verification code collision, we try again one time
        userContact = this.prepareUserContact()
        insertUserContactResult = await dbInsertUserContact(userContact, tx)
      } else {
        logger.error(
          `Unexpected, insert user contact failed, but email and email verification code don't collide`,
        )
        throw new Error('Error while saving user email contact')
      }
    }
    if (!insertUserContactResult.success) {
      logger.error(
        `insert user contact failed on its second try too, last verification code: ${userContact.emailVerificationCode}`,
      )
      throw new Error('Error while saving user email contact')
    }
    this.userContactId = insertUserContactResult.value
    // write user.email_id
    const affectedRows = await dbUserUpdateField(this.userId, 'emailId', this.userContactId, tx)
    if (affectedRows !== 1) {
      logger.error(`update emailId: ${this.userContactId} for user=${this.userId} failed`)
      throw new Error('Error while updating dbUser')
    }
    return { success: true, value: insertUserResult.value }
  }

  // Everybody holds a name from here on. Migration 0116 covers the members who
  // existed when it ran; without this, every account opened after it would carry
  // none again - and since a transaction stores `sender.alias`, their rows would
  // have nothing where a name belongs.
  //
  // A name the system builds is a proposal: it is reserved for them and can be
  // taken back, but it costs none of their four picks until they adopt it.
  public async generateAndStoreAlias(logger: Logger): Promise<string> {
    const userId = this.userId
    if (!userId) {
      throw new Error('Missing userId')
    }

    const { firstName, lastName, email } = this.user
    let origin: AliasOrigin = ALIAS_ORIGIN_CHOSEN
    let alias = this.user.alias

    // opertunistic first try
    if (!alias) {
      origin = ALIAS_ORIGIN_ASSIGNED
      alias = primaryAliasCandidate(firstName, lastName)
    }
    if (alias) {
      const result = await dbInsertUserAlias({ alias, userId, origin })
      if (result.success) {
        this.userAliasId = result.value
        return alias
      }
    }

    // alias seems to be already in use, so let's try some more
    // from here on the name is built by the system: a proposal, even if one was chosen
    origin = ALIAS_ORIGIN_ASSIGNED
    const aliasCandidatesArray = aliasCandidates(firstName, lastName, email, userId)
    const existingAliases = await dbFindUserAliasesExisting(aliasVariants(aliasCandidatesArray))

    const aliasCandidate = findFirstFreeAlias(existingAliases, aliasCandidatesArray)
    if (aliasCandidate) {
      const result = await dbInsertUserAlias({ alias: aliasCandidate, userId, origin })
      if (result.success) {
        this.userAliasId = result.value
        return aliasCandidate
      }
    }
    logger.error(
      `couldn't generate suitable alias from a set of ${aliasCandidatesArray.length * 100} variations`,
    )
    throw new Error("Couldn't generate valid alias")
  }

  public async run(logger: Logger): Promise<number> {
    let userId: number | null = null
    try {
      const storeUserAndContactResult = await this.storeUserAndUserContact(
        await this.prepareUser(),
        logger,
      )
      if (!storeUserAndContactResult.success) {
        return this.userAlreadyExist(storeUserAndContactResult.error.user, logger)
      }
      userId = storeUserAndContactResult.value
      logger.addContext('user', userId)
      const finalAlias = await this.generateAndStoreAlias(logger)
      if ((await dbUserUpdateField(userId, 'alias', finalAlias)) !== 1) {
        logger.error(`update user with id: ${userId} with alias: ${finalAlias} failed`)
        throw new Error('Error while storing the generated alias')
      }
    } catch (e) {
      await this.rollback()
      throw e
    }
    if (!this.emailVerificationCode) {
      throw new Error('Missing email verification code')
    }
    if (!userId) {
      throw new Error('Missing user id')
    }
    if (
      await this.sendAccountActivationEmail(
        `${CONFIG.EMAIL_LINK_VERIFICATION}${this.emailVerificationCode.toString()}`,
      )
    ) {
      await dbInsertEvent({
        type: EventType.EMAIL_CONFIRMATION,
        affectedUserId: userId,
        actingUserId: userId,
      })
    }

    await this.storeUserRegisterEvent()
    const dbUser = await dbFindUserWithContactById(userId)
    if (!dbUser) {
      logger.error(`cannot find user with id: ${userId} which were just created`)
      throw new Error('Cannot find just created user')
    }
    if (CONFIG.DLT_ACTIVE) {
      // register user into blockchain
      const homeCom = await getHomeCommunityDrizzle()
      if (!homeCom) {
        throw new Error('Missing Home Community')
      }
      await registerAddressTransaction(dbUser, homeCom)
    }
    await this.syncHumhub(dbUser, logger)
    await this.afterRun(dbUser)
    logger.info('registerUser() successful...')
    return userId
  }

  public async sendAccountActivationEmail(activationLink: string): Promise<boolean> {
    const { firstName, lastName, language, email } = this.user
    const result = await sendAccountActivationEmail({
      firstName,
      lastName,
      email,
      language,
      activationLink,
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })
    if (result instanceof Error) {
      throw result
    }
    return result !== null
  }

  public storeUserRegisterEvent(): Promise<void> {
    const userId = this.userId
    if (!userId) {
      throw new Error('Missing user id')
    }
    return dbInsertEvent({
      type: EventType.USER_REGISTER,
      affectedUserId: userId,
      actingUserId: userId,
    })
  }

  public async syncHumhub(
    user: DbUser,
    logger: Logger,
    spaceId: number | null = null,
  ): Promise<void> {
    try {
      await syncHumhub(null, user, user.gradidoId, spaceId)
    } catch (e) {
      logger.error("registerUser: couldn't reach out to humhub, disable for now", e)
    }
  }

  public async userAlreadyExist(existingUser: UserSelect, logger: Logger): Promise<number> {
    logger.addContext('user', existingUser.id)
    logger.removeContext('email')
    // ATTENTION: this logger-message will be exactly expected during tests, next line
    logger.info(`User already exists`)

    if (!existingUser.firstName || !existingUser.lastName) {
      throw new Error('Missing first name and/or last name of existing user')
    }

    await sendAccountMultiRegistrationEmail({
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      email: this.user.email,
      language: existingUser.language, // use language of the emails owner for sending
    })
    await dbInsertEvent({
      type: EventType.EMAIL_ACCOUNT_MULTIREGISTRATION,
      affectedUserId: existingUser.id,
      actingUserId: 0,
    })
    let fakeUserId = 0
    while (!fakeUserId) {
      fakeUserId = (randombytes_random() % (2048 * 16)) + 1
    }
    return fakeUserId
  }

  // for overloading from child classes, called before run is returning user id
  public afterRun(_user: DbUser): Promise<void> {
    return Promise.resolve()
  }
}
