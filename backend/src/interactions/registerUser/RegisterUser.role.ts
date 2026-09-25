import { OptInType } from '@enum/OptInType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { UserContactType } from '@enum/UserContactType'
import { registerAddressTransaction, sendAccountActivationEmail } from 'core'
import {
  ALIAS_ORIGIN_ASSIGNED,
  ALIAS_ORIGIN_CHOSEN,
  type AliasOrigin,
  DbUser,
  dbFindUserAliasesWithRegex,
  dbFindUserWithContactById,
  dbHomeCommunityGetUuid,
  dbInsertEvent,
  dbInsertUser,
  dbInsertUserAlias,
  dbInsertUserContact,
  dbIsUserContactFieldExist,
  dbLocalUserGradidoIdExist,
  dbRemoveUser,
  dbRemoveUserAlias,
  dbRemoveUserContact,
  dbUserUpdateField,
  getHomeCommunityDrizzle,
  UserContactInsert,
  UserInsert,
} from 'database'
import { Logger } from 'log4js'
import random from 'random-bigint'
import { aliasCandidates, findFirstFreeAlias, primaryAliasCandidate } from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { EventType } from '@/event/Events'
import { syncHumhub } from '@/graphql/resolver/util/syncHumhub'
import { getTimeDurationObject } from '@/util/time'
import { AbstractRegisterUserRole } from './AbstractRegisterUser.role'

/**
 * Everything a new account is made of. Moved verbatim out of `createUser` so the
 * assisted registration (EM-013) does not grow a second copy of this flow — the two
 * callers differ in exactly two places, both switched by `passwordPlain`:
 *
 *   - `passwordPlain: null` — the classic registration: the account has no password
 *     yet, the activation mail carries the set-password link. Behaviour is 1:1 what
 *     `createUser` always did; its existing tests are the proof.
 *   - `passwordPlain` set — an assisted registration: the guest typed their password
 *     at the table, so it is set right away and the mail only asks them to CONFIRM
 *     the address (a confirm-only link, not the set-password page).
 *
 * The caller has already normalised the input: email trimmed and lowercased, language
 * validated, and the address checked to be free.
 */

export class RegisterUserRole extends AbstractRegisterUserRole {
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
    return {
      email: this.user.email,
      userId: this.userId,
      type: UserContactType.USER_CONTACT_EMAIL,
      emailChecked: false,
      emailOptInTypeId: OptInType.EMAIL_OPT_IN_REGISTER,
      emailVerificationCode: random(64),
    }
  }

  // store user and user contact into db, not a transaction so the next count (dbCountUnconfirmedVouchedAccounts) is already aware of our new user
  public async storeUserAndUserContact(dbUser: UserInsert, logger: Logger): Promise<number> {
    // write user
    let insertUserResult = await dbInsertUser(dbUser)
    // maybe gradido uuid collided? Shouldn't happen nearly never, so let's try one time again
    if (!insertUserResult.success) {
      dbUser.gradidoId = uuidv4()
      insertUserResult = await dbInsertUser(dbUser)
    }
    if (!insertUserResult.success) {
      const isGradidoIdExist = await dbLocalUserGradidoIdExist(dbUser.gradidoId)
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
    let insertUserContactResult = await dbInsertUserContact(userContact)
    if (!insertUserContactResult.success) {
      if (
        await dbIsUserContactFieldExist('emailVerificationCode', userContact.emailVerificationCode)
      ) {
        // email verification code collision, we try again one time
        userContact = this.prepareUserContact()
        insertUserContactResult = await dbInsertUserContact(userContact)
      }
    }
    if (!insertUserContactResult.success) {
      const existingUserContactId = await dbIsUserContactFieldExist('email', this.user.email)
      if (existingUserContactId) {
        logger.error(
          `email already exist but dbFindUserByEmail should be aware of this, userContact.id: ${existingUserContactId}`,
        )
      } else {
        logger.error(
          `email verfication code random produce two already existing codes in a row, last one: ${userContact.emailVerificationCode}`,
        )
      }
      throw new Error('Error while saving user email contact')
    }
    this.userContactId = insertUserContactResult.value
    // write user.email_id
    const affectedRows = await dbUserUpdateField(this.userId, 'emailId', this.userContactId)
    if (affectedRows !== 1) {
      logger.error(`update emailId: ${this.userContactId} for user=${this.userId} failed`)
      throw new Error('Error while updating dbUser')
    }
    return insertUserResult.value
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
    const aliasCandidatesArray = aliasCandidates(firstName, lastName, email, userId)
    const existingAliases = await dbFindUserAliasesWithRegex(
      aliasCandidatesArray.map((candidate) => `^${candidate}[0-9]{0,2}$`),
    )

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
    try {
      const userId = await this.storeUserAndUserContact(await this.prepareUser(), logger)
      logger.addContext('user', userId)
      const finalAlias = await this.generateAndStoreAlias(logger)

      if ((await dbUserUpdateField(userId, 'alias', finalAlias)) !== 1) {
        logger.error(`update user with id: ${userId} with alias: ${finalAlias} failed`)
        throw new Error('Error while storing the generated alias')
      }
      if (!this.emailVerificationCode) {
        throw new Error('Missing email verification code')
      }
      await this.sendAccountActivationEmail(
        `${CONFIG.EMAIL_LINK_VERIFICATION}${this.emailVerificationCode.toString()}`,
      )
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
      await this.afterRun()
      logger.info('registerAccount() successful...')
      return userId
    } catch (e) {
      await this.rollback()
      throw e
    }
  }

  // for overloading from child classes, called before run is returning user id
  public afterRun(): Promise<void> {
    return Promise.resolve()
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
      new Error('Missing user id')
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
      logger.error("registerAccount: couldn't reach out to humhub, disable for now", e)
    }
  }
}
