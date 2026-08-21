// AI-GENERATED — not an architecture reference
import { OptInType } from '@enum/OptInType'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { AdminEmailStatus } from '@model/AdminEmailStatus'
import { PendingEmailChange } from '@model/PendingEmailChange'
import {
  sendAccountActivationEmail,
  sendEmailChangeConfirmEmail,
  sendEmailChangeDoneEmail,
  sendEmailChangeNoticeEmail,
  sendEmailChangeSupportEmail,
} from 'core'
import {
  AppDatabase,
  User as DbUser,
  UserContact as DbUserContact,
  dbCountElopageBuysByEmail,
  dbDeleteUserContact,
  dbEmailTaken,
  dbFindLatestEventForAffectedUser,
  dbFindOldestUserContact,
  dbFindPendingEmailChange,
  dbFindPendingEmailChangeByCode,
  dbFindPendingEmailChangeByVetoCode,
  dbInsertPendingEmailChange,
  dbLockUserRow,
  dbPurgeExpiredEmailChanges,
  dbSaveUser,
  dbSaveUserContact,
  getUserById,
} from 'database'
import { getLogger } from 'log4js'
import random from 'random-bigint'
import { emailSchema } from 'shared'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  canEmailResend,
  emailChangeExpiryCutoff,
  isEmailVerificationCodeValid,
  resendAllowedAt,
} from '@/data/EmailVerificationCode.logic'
import {
  EVENT_EMAIL_ADMIN_CONFIRMATION,
  EVENT_EMAIL_CHANGE_CONFIRMED,
  EVENT_EMAIL_CHANGE_REQUEST,
  EventType,
} from '@/event/Events'
import { encryptPassword, verifyPassword } from '@/password/PasswordEncryptor'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { getTimeDurationObject, printTimeDuration } from '@/util/time'

/**
 * Changing the e-mail address of one's own account.
 *
 * The old address stays in force until the new one is confirmed. The new address gets a
 * second contact row and a confirmation mail; the old address gets a notice with a veto
 * link. Nothing about the old row changes - it stays for good, because the oldest row is
 * what the GDT server knows the member by, and because the Elopage webhook would open a
 * second account for an address it cannot find.
 *
 * Two things that look like details are the security model:
 *  - The current password is asked for. A session on an unlocked phone is not enough.
 *  - The veto is a notice, not a precondition. Whoever still reads the old mailbox can
 *    stop the change; whoever lost it is not locked out of changing - that is the most
 *    common reason to change an address in the first place.
 */

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.EmailChangeResolver.${method}`)

const db = AppDatabase.getInstance()

const CODE_INVALID = 'Invalid or expired code'

const confirmLink = (code: string): string => `${CONFIG.EMAIL_LINK_EMAIL_CHANGE}${code}`
const revokeLink = (vetoCode: string): string =>
  `${CONFIG.EMAIL_LINK_EMAIL_CHANGE}revoke/${vetoCode}`

const issuedAt = (contact: DbUserContact): Date => contact.updatedAt || contact.createdAt

const toPending = (contact: DbUserContact, lastRequestAt: Date | null): PendingEmailChange =>
  new PendingEmailChange(
    contact.email,
    issuedAt(contact),
    resendAllowedAt(lastRequestAt ?? issuedAt(contact)),
  )

@Resolver()
export class EmailChangeResolver {
  @Authorized([RIGHTS.MANAGE_OWN_EMAIL])
  @Query(() => PendingEmailChange, { nullable: true })
  async pendingEmailChange(@Ctx() context: Context): Promise<PendingEmailChange | null> {
    const user = getUser(context)
    const pending = await dbFindPendingEmailChange(user.id)
    if (!pending) {
      return null
    }
    if (!isEmailVerificationCodeValid(issuedAt(pending))) {
      // Ran past its window: it holds the address for nobody any more.
      await dbDeleteUserContact(pending.id)
      return null
    }
    const lastRequest = await dbFindLatestEventForAffectedUser(
      EventType.EMAIL_CHANGE_REQUEST,
      user.id,
    )
    return toPending(pending, lastRequest?.createdAt ?? null)
  }

  @Authorized([RIGHTS.MANAGE_OWN_EMAIL])
  @Mutation(() => PendingEmailChange)
  async requestEmailChange(
    @Arg('email') rawEmail: string,
    @Arg('password') password: string,
    @Ctx() context: Context,
  ): Promise<PendingEmailChange> {
    const logger = createLogger('requestEmailChange')
    const user = getUser(context)
    logger.addContext('user', user.id)
    logger.info('requestEmailChange...')

    if (!(await verifyPassword(user, password))) {
      logger.warn('password did not match')
      throw new LogError('Password is invalid')
    }

    // Under the legacy encryption type the address itself salts the password. Moving the
    // marker to a new address would then lock the member out. The login has re-keyed
    // every account that signed in since that type was retired, so this rarely fires -
    // but here is the one place that holds the plain password AND is about to change the
    // address, so here it is made certain.
    if (
      (user.passwordEncryptionType as PasswordEncryptionType) !== PasswordEncryptionType.GRADIDO_ID
    ) {
      user.passwordEncryptionType = PasswordEncryptionType.GRADIDO_ID
      user.password = await encryptPassword(user, password)
      await dbSaveUser(user)
      logger.info('re-keyed the password from the address to the gradido id')
    }

    const email = rawEmail.trim().toLowerCase()
    if (!emailSchema.safeParse(email).success) {
      throw new LogError('Invalid email address')
    }
    if (email === user.emailContact.email.toLowerCase()) {
      throw new LogError('This is already the email address of this account')
    }

    // A change somebody else started for this address and never finished must not block it.
    await dbPurgeExpiredEmailChanges(emailChangeExpiryCutoff(), email)

    // From the rate-limit read to the insert, the member's row is held under a lock: two
    // requests racing each other cannot both see "nothing pending" and both insert, nor
    // both slip through the window. One change at a time is an invariant, not a hope.
    // The rate limit itself lives on the event, not on the pending row: the row can be
    // cancelled and recreated at will, the event cannot.
    const queryRunner = db.getDataSource().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    let pending: DbUserContact
    try {
      const manager = queryRunner.manager
      await dbLockUserRow(user.id, manager)

      const lastRequest = await dbFindLatestEventForAffectedUser(
        EventType.EMAIL_CHANGE_REQUEST,
        user.id,
        manager,
      )
      if (lastRequest && !canEmailResend(lastRequest.createdAt)) {
        logger.warn('email change requested again inside the resend window')
        throw new LogError(
          `Email already sent less than ${printTimeDuration(CONFIG.EMAIL_CODE_REQUEST_TIME)} ago`,
        )
      }

      // Only one change at a time: a new request replaces whatever was pending - same
      // address (a fresh mail) or another one (a change of mind). Hard delete, so the
      // previous address is free again at once.
      const previous = await dbFindPendingEmailChange(user.id, manager)
      if (previous) {
        await dbDeleteUserContact(previous.id, manager)
      }

      if (await dbEmailTaken(email, manager)) {
        throw new LogError('Email address already in use')
      }

      const inserted = await dbInsertPendingEmailChange(
        {
          userId: user.id,
          email,
          verificationCode: random(64).toString(),
          vetoCode: random(64).toString(),
        },
        manager,
      )
      if (!inserted.success) {
        // Lost a race for the same address - the same answer as if it had been taken before.
        throw new LogError('Email address already in use')
      }
      pending = inserted.value

      await EVENT_EMAIL_CHANGE_REQUEST(user, manager)
      await queryRunner.commitTransaction()
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      throw e
    } finally {
      await queryRunner.release()
    }

    const timeDurationObject = getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME)
    await sendEmailChangeConfirmEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: pending.email,
      language: user.language,
      confirmLink: confirmLink(pending.emailVerificationCode),
      timeDurationObject,
    })
    await sendEmailChangeNoticeEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailContact.email,
      language: user.language,
      newEmail: pending.email,
      revokeLink: revokeLink(pending.changeVetoCode as string),
      timeDurationObject,
    })
    logger.info('requestEmailChange... mails sent')

    return toPending(pending, new Date())
  }

  /**
   * Sends the two mails of a pending change once more, with fresh codes. No password here:
   * nothing about the target changes, only the codes - and the rate limit on the request
   * event applies to this just as to a new request.
   */
  @Authorized([RIGHTS.MANAGE_OWN_EMAIL])
  @Mutation(() => PendingEmailChange)
  async resendEmailChange(@Ctx() context: Context): Promise<PendingEmailChange> {
    const logger = createLogger('resendEmailChange')
    const user = getUser(context)
    logger.addContext('user', user.id)
    // The same lock as in requestEmailChange: two resends racing each other would both pass
    // the window check and both send.
    const queryRunner = db.getDataSource().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    let pending: DbUserContact
    try {
      const manager = queryRunner.manager
      await dbLockUserRow(user.id, manager)

      const found = await dbFindPendingEmailChange(user.id, manager)
      if (!found) {
        throw new LogError('No email change is pending')
      }
      if (!isEmailVerificationCodeValid(issuedAt(found))) {
        // Ran past its window. Resending would renew it - and with it the hold on the
        // address. The removal is kept, the answer is the one for "nothing pending".
        await dbDeleteUserContact(found.id, manager)
        await queryRunner.commitTransaction()
        throw new LogError('No email change is pending')
      }
      const lastRequest = await dbFindLatestEventForAffectedUser(
        EventType.EMAIL_CHANGE_REQUEST,
        user.id,
        manager,
      )
      if (lastRequest && !canEmailResend(lastRequest.createdAt)) {
        throw new LogError(
          `Email already sent less than ${printTimeDuration(CONFIG.EMAIL_CODE_REQUEST_TIME)} ago`,
        )
      }
      found.emailVerificationCode = random(64).toString()
      found.changeVetoCode = random(64).toString()
      found.updatedAt = new Date()
      await dbSaveUserContact(found, manager)
      await EVENT_EMAIL_CHANGE_REQUEST(user, manager)
      await queryRunner.commitTransaction()
      pending = found
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction()
      }
      throw e
    } finally {
      await queryRunner.release()
    }

    const timeDurationObject = getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME)
    await sendEmailChangeConfirmEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: pending.email,
      language: user.language,
      confirmLink: confirmLink(pending.emailVerificationCode),
      timeDurationObject,
    })
    await sendEmailChangeNoticeEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailContact.email,
      language: user.language,
      newEmail: pending.email,
      revokeLink: revokeLink(pending.changeVetoCode as string),
      timeDurationObject,
    })
    logger.info('resendEmailChange... mails sent again')
    return toPending(pending, new Date())
  }

  /** Returns the address that is now in force, so a wallet that is open can show it at once. */
  @Authorized([RIGHTS.CONFIRM_EMAIL_CHANGE])
  @Mutation(() => String)
  async confirmEmailChange(@Arg('code') code: string): Promise<string> {
    const logger = createLogger('confirmEmailChange')
    logger.info('confirmEmailChange...')
    const pending = await dbFindPendingEmailChangeByCode(code)
    if (!pending) {
      // Unknown and expired read the same from outside - there is nothing to tell apart.
      logger.warn('no pending change for this code')
      throw new LogError(CODE_INVALID)
    }
    if (!isEmailVerificationCodeValid(issuedAt(pending))) {
      await dbDeleteUserContact(pending.id)
      logger.warn('code ran past its window')
      throw new LogError(CODE_INVALID)
    }
    logger.addContext('user', pending.userId)

    // `UserContact.user` is the inverse of `users.email_id` and empty for a pending row;
    // the member is loaded by id.
    const user = await getUserById(pending.userId, false, true)
    const oldEmail = user.emailContact.email

    const queryRunner = db.getDataSource().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    try {
      pending.emailChecked = true
      pending.changeVetoCode = null
      // One-time code: whoever still holds the link cannot do anything with it now.
      pending.emailVerificationCode = random(64).toString()
      await dbSaveUserContact(pending, queryRunner.manager)

      user.emailId = pending.id
      user.emailContact = pending
      await dbSaveUser(user, queryRunner.manager)

      // The record belongs to the change: neither without the other.
      await EVENT_EMAIL_CHANGE_CONFIRMED(user, queryRunner.manager)

      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw new LogError('Error confirming the email change', e)
    } finally {
      await queryRunner.release()
    }
    logger.info('confirmEmailChange... marker moved')

    const common = { firstName: user.firstName, lastName: user.lastName, language: user.language }
    // Both addresses hear of it: the new one because it is now in force, the old one
    // because if this was not the member, this mail is their last chance to notice.
    await sendEmailChangeDoneEmail({
      ...common,
      email: pending.email,
      oldEmail,
      newEmail: pending.email,
    })
    await sendEmailChangeDoneEmail({
      ...common,
      email: oldEmail,
      oldEmail,
      newEmail: pending.email,
    })

    // The support mailbox is where the GDT server and the newsletter get brought up to date
    // by hand. The oldest row is named because it is the address the GDT server is asked
    // with - that is the one to merge the new address into.
    const oldest = await dbFindOldestUserContact(user.id)
    await sendEmailChangeSupportEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: CONFIG.COMMUNITY_SUPPORT_MAIL,
      language: user.language,
      alias: user.alias ?? '',
      oldEmail,
      newEmail: pending.email,
      gdtEmail: oldest?.email ?? oldEmail,
    })
    logger.info('confirmEmailChange... mails sent')
    return pending.email
  }

  @Authorized([RIGHTS.REVOKE_EMAIL_CHANGE])
  @Mutation(() => Boolean)
  async revokeEmailChange(@Arg('vetoCode') vetoCode: string): Promise<boolean> {
    const logger = createLogger('revokeEmailChange')
    logger.info('revokeEmailChange...')
    const pending = await dbFindPendingEmailChangeByVetoCode(vetoCode)
    if (!pending) {
      logger.warn('no pending change for this veto code')
      throw new LogError(CODE_INVALID)
    }
    logger.addContext('user', pending.userId)
    const deleted = await dbDeleteUserContact(pending.id)
    if (!deleted.success) {
      throw new LogError(CODE_INVALID)
    }
    logger.info('revokeEmailChange... pending change dropped')
    return true
  }

  @Authorized([RIGHTS.MANAGE_OWN_EMAIL])
  @Mutation(() => Boolean)
  async cancelEmailChange(@Ctx() context: Context): Promise<boolean> {
    const logger = createLogger('cancelEmailChange')
    const user = getUser(context)
    logger.addContext('user', user.id)
    const pending = await dbFindPendingEmailChange(user.id)
    if (pending) {
      await dbDeleteUserContact(pending.id)
      logger.info('cancelEmailChange... pending change dropped')
    }
    return true
  }

  /**
   * For the e-mail tab of the admin's member search: the address the GDT server is asked
   * with, a change under way, and whether the current address may be corrected.
   */
  @Authorized([RIGHTS.VIEW_USER_EMAIL_STATUS])
  @Query(() => AdminEmailStatus)
  async adminEmailStatus(@Arg('userId', () => Int) userId: number): Promise<AdminEmailStatus> {
    const user: DbUser = await getUserById(userId, false, true)
    const oldest = await dbFindOldestUserContact(user.id)
    const pending = await dbFindPendingEmailChange(user.id)
    return new AdminEmailStatus({
      gdtEmail: oldest?.email ?? user.emailContact.email,
      currentConfirmed: user.emailContact.emailChecked,
      elopageBuysOnCurrent: (await dbCountElopageBuysByEmail(user.emailContact.email)) > 0,
      pendingEmail: pending?.email ?? null,
      pendingSince: pending ? issuedAt(pending) : null,
    })
  }

  /**
   * A typo at registration: the member cannot reach the account, the confirmation mail
   * goes nowhere. Only while the address was NEVER confirmed may an admin correct it - in
   * place, not as a second row, because a mistyped address was never anybody's key and
   * must not become the one the GDT server is asked with. A confirmed address is the
   * member's own to change, from their settings, with their password.
   */
  @Authorized([RIGHTS.ADMIN_REPLACE_UNCONFIRMED_EMAIL])
  @Mutation(() => String)
  async adminReplaceUnconfirmedEmail(
    @Arg('userId', () => Int) userId: number,
    @Arg('email') rawEmail: string,
    @Ctx() context: Context,
  ): Promise<string> {
    const logger = createLogger('adminReplaceUnconfirmedEmail')
    const moderator = getUser(context)
    const user = await getUserById(userId, false, true)
    logger.addContext('user', user.id)
    logger.info('adminReplaceUnconfirmedEmail...')

    if (user.emailContact.emailChecked) {
      throw new LogError('The address is confirmed - only the member can change it')
    }
    const email = rawEmail.trim().toLowerCase()
    if (!emailSchema.safeParse(email).success) {
      throw new LogError('Invalid email address')
    }
    await dbPurgeExpiredEmailChanges(emailChangeExpiryCutoff(), email)
    if (await dbEmailTaken(email)) {
      throw new LogError('Email address already in use')
    }

    const contact = user.emailContact
    contact.email = email
    contact.emailVerificationCode = random(64).toString()
    contact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
    contact.updatedAt = new Date()
    await dbSaveUserContact(contact)

    await sendAccountActivationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email,
      language: user.language,
      activationLink: `${CONFIG.EMAIL_LINK_SETPASSWORD}${contact.emailVerificationCode}`,
      timeDurationObject: getTimeDurationObject(CONFIG.EMAIL_CODE_VALID_TIME),
    })
    await EVENT_EMAIL_ADMIN_CONFIRMATION(user, moderator)
    logger.info('adminReplaceUnconfirmedEmail... corrected and activation mail sent')
    return email
  }
}
