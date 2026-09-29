import { sendAssistedRegistrationConfirmEmail } from 'core'
import {
  DbUser,
  DrizzleTransaction,
  dbCountUnconfirmedVouchedAccounts,
  dbFindUserById,
  dbInsertEvent,
  dbUserUpdatePassword,
  drizzleDb,
  EventType,
  UserInsert,
  usersTable,
} from 'database'
import { sql } from 'drizzle-orm'
import { Logger } from 'log4js'
import { PasswordEncryptionType, parseOrThrowFirstIssue, Result } from 'shared'
import { CONFIG } from '@/config'
import { PRESENCE_MAX_UNCONFIRMED, verifyPresenceCode } from '@/data/PresenceCode.logic'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { getTimeDurationObject } from '@/util/time'
import { CardRegistration, CreateUser, cardRegistrationSchema } from './createUser.schema'
import { RegisterUserDuplicateError } from './errorTypes'
import { RegisterUserRole } from './RegisterUser.role'

export class RegisterUserCardRole extends RegisterUserRole<CardRegistration> {
  private referrerId: number | null = null
  private gradidoIdByPasswordStart: string | null = null
  private passwordEncryptionPromise: Promise<bigint> | null = null

  constructor(createUserInput: CreateUser) {
    super(parseOrThrowFirstIssue(cardRegistrationSchema, createUserInput))
  }

  // The code names the member who showed it; the address the guest came from is not asked.
  // Checked before the address is looked at, like everything about the code.
  public async prepareUser(): Promise<UserInsert> {
    const dbUser = await super.prepareUser()
    const referrerId = verifyPresenceCode(
      this.user.presenceCode,
      dbUser.communityUuid,
      this.startDate,
    )
    // Deleted after showing the code: without the member, nobody vouches.
    const referrer = referrerId ? await dbFindUserById(referrerId) : null
    if (!referrer) {
      throw new Error('Presence code invalid or expired')
    }
    dbUser.referrerId = referrer.id
    this.referrerId = referrer.id
    return dbUser
  }

  public async storeUserAndUserContact(
    dbUser: UserInsert,
    logger: Logger,
  ): Promise<Result<number, RegisterUserDuplicateError>> {
    dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
    // it take some time, let it run in parallel
    this.gradidoIdByPasswordStart = dbUser.gradidoId
    this.passwordEncryptionPromise = encryptPassword(dbUser, this.user.password)
    return await drizzleDb().transaction(
      async (tx: DrizzleTransaction) => {
        const referrerId = dbUser.referrerId
        if (!referrerId) {
          throw new Error('Presence code invalid or expired')
        }

        // lock referrer user, next registration selecting this user must wait until we are done with this transaction
        // after our new user was stored into db, we can leave transaction, because than the next call of dbCountUnconfirmedVouchedAccounts will find the user
        await tx.execute(sql`
          SELECT id
          FROM ${usersTable}
          WHERE id = ${referrerId}
          FOR UPDATE
      `)
        // E-019: an account that can act without confirming email address at first is opened only while the member who
        // vouches for it holds fewer than PRESENCE_MAX_UNCONFIRMED unconfirmed ones. Counted here,
        // before the address: at the limit a taken address gets the same refusal as a free one -
        // the silence below would tell them apart - and a request over the limit never waits in
        // the member's line. Counted again in that line, where it decides: one after another per
        // member in this process, and whoever waits holds no connection.
        if ((await dbCountUnconfirmedVouchedAccounts(referrerId, tx)) >= PRESENCE_MAX_UNCONFIRMED) {
          throw new Error('Vouching limit reached')
        }
        // running normal RegisterUser Stuff from RegisterUserRole
        return await super.storeUserAndUserContact(dbUser, logger, tx)
      },
      { isolationLevel: 'repeatable read' },
    )
  }

  // The password exists already, so the set-password page behind the activation link would
  // be the wrong door: this link only confirms that the address belongs to the guest (EM-013).
  public async sendAccountActivationEmail(_activationLink: string): Promise<boolean> {
    const { firstName, lastName, language, email } = this.user
    const result = await sendAssistedRegistrationConfirmEmail({
      firstName,
      lastName,
      email,
      language,
      confirmLink: `${CONFIG.EMAIL_LINK_CONFIRM_EMAIL}${this.emailVerificationCode}`,
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })
    if (result instanceof Error) {
      throw result
    }
    return result !== null
  }

  public storeUserRegisterEvent(): Promise<void> {
    const userId = this.userId
    const referrerId = this.referrerId
    if (!userId) {
      throw new Error('Missing user id')
    }
    if (!referrerId) {
      throw new Error('Missing referrer id')
    }

    return dbInsertEvent({
      type: EventType.USER_REGISTER_PRESENCE,
      affectedUserId: userId,
      actingUserId: referrerId,
    })
  }

  public async afterRun(user: DbUser): Promise<void> {
    if (!this.userId || !this.gradidoIdByPasswordStart) {
      throw new Error('Missing id')
    }
    if (!this.passwordEncryptionPromise) {
      throw new Error('Password encryption was never started in the first place')
    }
    let passwordHash: bigint = 0n
    if (this.gradidoIdByPasswordStart !== user.gradidoId) {
      passwordHash = await encryptPassword(user, this.user.password)
    } else {
      passwordHash = await this.passwordEncryptionPromise
    }
    return dbUserUpdatePassword(this.userId, PasswordEncryptionType.GRADIDO_ID, passwordHash)
  }
}
