import {
  DrizzleTransaction,
  dbCountUnconfirmedVouchedAccounts,
  dbInsertEvent,
  dbUserUpdatePassword,
  drizzleDb,
  UserInsert,
  usersTable,
} from 'database'
import { sql } from 'drizzle-orm'
import { Logger } from 'log4js'
import { PasswordEncryptionType } from 'shared'
import { PRESENCE_MAX_UNCONFIRMED, verifyPresenceCode } from '@/data/PresenceCode.logic'
import { EventType } from '@/event/EventType'
import { encryptPassword } from '@/password/PasswordEncryptor'
import { CreateUser } from './createUser.schema'
import { RegisterUserReferrerRole } from './RegisterUserReferrer.role'

export class RegisterUserCardRole extends RegisterUserReferrerRole {
  private presenceCode: string
  private password: string
  private passwordEncryptionPromise: Promise<bigint> | null = null

  constructor(user: CreateUser) {
    if (!user.presenceCode) {
      throw new Error('Missing presence Code')
    }
    if (!user.password) {
      throw new Error('Presence code requires a password')
    }

    super(user)
    this.presenceCode = user.presenceCode
    this.password = user.password
  }

  public async storeUserAndUserContact(dbUser: UserInsert, logger: Logger): Promise<number> {
    // The code must be the one shown by the member whose address the guest came from.
    // Its own answer, not "expired": the seal is bound to this community, so without it
    // every code fails the check - and the guest would be told to fetch a fresh one, which
    // fails the same way. `presenceCode` says the same when it cannot mint one.
    const presenceValid = verifyPresenceCode(
      this.presenceCode,
      this.user.referrerAlias ?? '',
      dbUser.communityUuid,
      this.startDate,
    )
    if (!presenceValid) {
      throw new Error('Presence code invalid or expired')
    }

    dbUser.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
    // it take some time, let it run in parallel
    this.passwordEncryptionPromise = encryptPassword(dbUser, this.password)
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
        return await super.storeUserAndUserContact(dbUser, logger)
      },
      { isolationLevel: 'repeatable read' },
    )
  }

  public storeUserRegisterEvent(): Promise<void> {
    const userId = this.userId
    const referrerId = this.referrerId
    if (!userId) {
      new Error('Missing user id')
    }
    if (!referrerId) {
      new Error('Missing referrer id')
    }

    return dbInsertEvent({
      type: EventType.USER_REGISTER_PRESENCE,
      affectedUserId: userId,
      actingUserId: referrerId,
    })
  }

  public async afterRun(): Promise<void> {
    if (!this.userId) {
      throw new Error('Missing user id')
    }
    if (!this.passwordEncryptionPromise) {
      throw new Error('Password encryption was never started in the first place')
    }
    const passwordHash = await this.passwordEncryptionPromise
    return dbUserUpdatePassword(this.userId, PasswordEncryptionType.GRADIDO_ID, passwordHash)
  }
}
