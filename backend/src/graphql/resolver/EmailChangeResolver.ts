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
  dbFindUserContactByEmail,
  dbInsertPendingEmailChange,
  dbLockUserRow,
  dbMarkUserContactPending,
  dbPurgeExpiredEmailChanges,
  dbReleasePendingEmailChange,
  dbSaveUser,
  dbSaveUserContact,
  getUserById,
} from 'database'
import { getLogger } from 'log4js'
import random from 'random-bigint'
import { emailSchema } from 'shared'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { EntityManager } from 'typeorm'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  canEmailResend,
  emailChangeExpiryCutoff,
  emailVerificationCodeValidUntil,
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
import { getTimeDurationObject, printDateTime, printTimeDuration } from '@/util/time'

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

const freshCodes = () => ({
  verificationCode: random(64).toString(),
  vetoCode: random(64).toString(),
})

/**
 * Everything that moves a pending change - starting it, re-sending it, carrying it out,
 * giving it up - runs in here: one `REPEATABLE READ` transaction with the member's row
 * held under `dbLockUserRow`.
 *
 * ⛔ The lock is not decoration, and the reason changed with the change-back. A release
 * used to be a hard DELETE on a row id nobody would use again, so a straggler hit nothing.
 * Now a release WRITES - a take-back row is restored, ids are reused - and two paths that
 * read before they write can undo each other:
 *  - confirm reads, veto releases, confirm saves: TypeORM sees no database row behind the
 *    entity and INSERTS it again, id and all. The change stands although it was withdrawn.
 *  - cancel reads, a fresh request rewrites the same row, cancel saves: the mail that just
 *    went out is dead on arrival and the wallet says nothing is pending.
 * Both vanish if the row is re-read INSIDE the lock, which is what every caller does here.
 */
const underMemberLock = async <T>(
  userId: number,
  work: (manager: EntityManager) => Promise<T>,
): Promise<T> => {
  const queryRunner = db.getDataSource().createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction('REPEATABLE READ')
  try {
    await dbLockUserRow(userId, queryRunner.manager)
    const result = await work(queryRunner.manager)
    await queryRunner.commitTransaction()
    return result
  } catch (e) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction()
    }
    throw e
  } finally {
    await queryRunner.release()
  }
}

/**
 * Every way a change can end without being carried out. A fresh row goes, a taken-back one
 * is restored - and either way the mailed code stops working, which is why a new one is
 * handed in (see `dbReleasePendingEmailChange`).
 */
const releasePending = async (
  contact: DbUserContact,
  manager?: EntityManager,
): Promise<'restored' | 'deleted'> =>
  dbReleasePendingEmailChange(contact, random(64).toString(), manager)

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
      // Ran past its window: it holds the address for nobody any more. Released under the
      // lock and on a row re-read there - opening the settings must not undo a change the
      // member started in another tab a moment ago.
      await underMemberLock(user.id, async (manager) => {
        const locked = await dbFindPendingEmailChange(user.id, manager)
        if (locked && !isEmailVerificationCodeValid(issuedAt(locked))) {
          await releasePending(locked, manager)
        }
      })
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
    const pending = await underMemberLock(user.id, async (manager) => {
      let row: DbUserContact

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

      // Going BACK to an address one held before must work - the alias does the same, and
      // for the same reason: an address one has already proven is not somebody else's.
      // `user_contacts.email` is unique, so there is no second row to insert; the row is
      // already there and only gets borrowed for the change.
      // ⛔ ONE look, not two. `email` is unique, so at most one row can hold it and its
      // `user_id` answers both questions at once. Asking them separately meant asking with
      // two different visibilities - `dbEmailTaken` counts deleted rows, the ownership
      // question did not - and the day anything soft-deletes a contact row those two
      // disagree: the member is told their OWN earlier address is already in use, which is
      // exactly what the change back was built to end.
      const existing = await dbFindUserContactByEmail(email, manager)
      if (existing && (existing.userId !== user.id || existing.deletedAt !== null)) {
        throw new LogError('Email address already in use')
      }
      const own = existing

      // Only one change at a time: a new request replaces whatever was pending - same
      // address (a fresh mail) or another one (a change of mind). Unless it IS the row we
      // are about to borrow, in which case releasing it first would only undo the work.
      const previous = await dbFindPendingEmailChange(user.id, manager)
      if (previous && previous.id !== own?.id) {
        await releasePending(previous, manager)
      }

      if (own?.emailChecked) {
        // A real take-back: the member's own PROVEN address, borrowed for the change. Fresh
        // codes and a fresh window are right here - the address is theirs however this ends,
        // so its window keeps nobody out.
        row = await dbMarkUserContactPending(own, freshCodes(), manager)
      } else if (own) {
        // ⛔ The member's own change on this very address, still running - they are asking
        // again because the mail did not arrive. Writing the row would move `updatedAt`, and
        // `updatedAt` is the moment the whole change is measured from (the window check, and
        // `dbPurgeExpiredEmailChanges`). Every repeat would buy another full window: the same
        // endless hold that `resendEmailChange` stopped selling in #3806, bought through the
        // other door instead. So the row is left exactly as it is and the codes already on it
        // go out again - which also means the mail names the deadline the change really has.
        row = own
      } else {
        const inserted = await dbInsertPendingEmailChange(
          { userId: user.id, email, ...freshCodes() },
          manager,
        )
        if (!inserted.success) {
          // Lost a race for the same address - the same answer as if it had been taken before.
          throw new LogError('Email address already in use')
        }
        row = inserted.value
      }

      await EVENT_EMAIL_CHANGE_REQUEST(user, manager)
      return row
    })

    // A moment, not a duration. A resend hands out the deadline the change already had, so
    // "valid for 24 hours" would be a promise the link cannot keep. `issuedAt` is what every
    // other reader of this row measures by, so the mail now says the same thing they do.
    const validUntil = printDateTime(
      emailVerificationCodeValidUntil(issuedAt(pending)),
      user.language,
    )
    await sendEmailChangeConfirmEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: pending.email,
      language: user.language,
      confirmLink: confirmLink(pending.emailVerificationCode),
      validUntil,
    })
    // A veto goes only to a CONFIRMED address (EM-013). A never-confirmed address has
    // never proven possession, so the veto protects nobody there — and it would arm the
    // wrong person: in the assisted flow, "correct a mistyped address" changes away
    // from an unconfirmed row, and a veto mail to that (possibly foreign) mailbox would
    // let a stranger block the correction. Structurally the same mistake that killed
    // EM-010, one level deeper.
    if (user.emailContact.emailChecked) {
      await sendEmailChangeNoticeEmail({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailContact.email,
        language: user.language,
        newEmail: pending.email,
        revokeLink: revokeLink(pending.changeVetoCode as string),
        validUntil,
      })
    }
    logger.info('requestEmailChange... mails sent')

    return toPending(pending, new Date())
  }

  /**
   * Sends the two mails of a pending change once more - the same codes, so the link from
   * the first mail keeps working. No password here: nothing about the change is altered at
   * all, and the rate limit on the request event applies just as to a new request.
   */
  @Authorized([RIGHTS.MANAGE_OWN_EMAIL])
  @Mutation(() => PendingEmailChange)
  async resendEmailChange(@Ctx() context: Context): Promise<PendingEmailChange> {
    const logger = createLogger('resendEmailChange')
    const user = getUser(context)
    logger.addContext('user', user.id)
    // The same lock as in requestEmailChange: two resends racing each other would both pass
    // the window check and both send.
    // ⚠️ "nothing pending" is RETURNED from inside the lock, not thrown out of it: an
    // expired row is released, and that release has to survive - throwing here would roll
    // it back and leave the address held by a change that is already over. The refusal is
    // raised after the transaction has committed.
    const pending = await underMemberLock(user.id, async (manager) => {
      const found = await dbFindPendingEmailChange(user.id, manager)
      if (!found) {
        return null
      }
      if (!isEmailVerificationCodeValid(issuedAt(found))) {
        await releasePending(found, manager)
        return null
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
      // ⛔ The row is deliberately NOT written here, and fresh codes are deliberately not
      // issued. `updatedAt` is an @UpdateDateColumn with `onUpdate`, so ANY save moves it -
      // and `updatedAt` is the moment the whole change is measured from, both by the window
      // check above and by `dbPurgeExpiredEmailChanges`. Rotating the codes would buy the
      // change another full window, once per resend, for as long as somebody kept pressing.
      // Re-sending the codes already on the row costs nothing - same address, same member -
      // and it leaves the change the one lifetime it started with.
      //
      // ⚠️ The same door exists in `requestEmailChange`, and until 27.08.2026 it was open:
      // asking again for the SAME address wrote the row and bought the window this branch
      // refuses to buy. Both are shut now. What still renews a hold is cancelling and asking
      // again - that is left standing on purpose, because a never-confirmed change no longer
      // keeps anybody out (`checkEmailExists` gives it up), so the renewal costs nothing.
      await EVENT_EMAIL_CHANGE_REQUEST(user, manager)
      return found
    })
    if (!pending) {
      throw new LogError('No email change is pending')
    }

    // A moment, not a duration. A resend hands out the deadline the change already had, so
    // "valid for 24 hours" would be a promise the link cannot keep. `issuedAt` is what every
    // other reader of this row measures by, so the mail now says the same thing they do.
    const validUntil = printDateTime(
      emailVerificationCodeValidUntil(issuedAt(pending)),
      user.language,
    )
    await sendEmailChangeConfirmEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: pending.email,
      language: user.language,
      confirmLink: confirmLink(pending.emailVerificationCode),
      validUntil,
    })
    // Same rule as in requestEmailChange: a veto goes only to a confirmed address.
    if (user.emailContact.emailChecked) {
      await sendEmailChangeNoticeEmail({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailContact.email,
        language: user.language,
        newEmail: pending.email,
        revokeLink: revokeLink(pending.changeVetoCode as string),
        validUntil,
      })
    }
    logger.info('resendEmailChange... mails sent again')
    return toPending(pending, new Date())
  }

  /** Returns the address that is now in force, so a wallet that is open can show it at once. */
  @Authorized([RIGHTS.CONFIRM_EMAIL_CHANGE])
  @Mutation(() => String)
  async confirmEmailChange(@Arg('code') code: string): Promise<string> {
    const logger = createLogger('confirmEmailChange')
    logger.info('confirmEmailChange...')
    const found = await dbFindPendingEmailChangeByCode(code)
    if (!found) {
      // Unknown and expired read the same from outside - there is nothing to tell apart.
      logger.warn('no pending change for this code')
      throw new LogError(CODE_INVALID)
    }
    logger.addContext('user', found.userId)

    // ⛔ Everything from here is decided AGAIN under the member's lock, on a row re-read
    // inside it. The search above only says whose row this is. Between it and the write
    // below, a veto or a cancel can release the row - and `save` on the entity read
    // earlier would put it back, id and all, so the change would stand although somebody
    // had withdrawn it.
    const settled = await underMemberLock(found.userId, async (manager) => {
      const pending = await dbFindPendingEmailChangeByCode(code, manager)
      if (!pending) {
        logger.warn('the change this code belonged to was already gone')
        throw new LogError(CODE_INVALID)
      }
      if (!isEmailVerificationCodeValid(issuedAt(pending))) {
        await releasePending(pending, manager)
        logger.warn('code ran past its window')
        throw new LogError(CODE_INVALID)
      }

      // `UserContact.user` is the inverse of `users.email_id` and empty for a pending row;
      // the member is loaded by id.
      const user = await getUserById(pending.userId, false, true)
      const oldContact = user.emailContact
      const oldEmail = oldContact.email
      const oldWasConfirmed = oldContact.emailChecked
      // A row that was already confirmed is one of the member's own earlier addresses:
      // this is a change BACK, and the support has nothing to merge on the GDT server.
      // Read BEFORE the mutation below, which sets the very flag it asks about.
      const takeBack = pending.emailChecked

      pending.emailChecked = true
      pending.changeVetoCode = null
      // ⛔ Settled, so no longer in flight. Without this every address the member ever
      // changed to would keep the CHANGE type and look like a pending change to the finder.
      pending.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
      // One-time code: whoever still holds the link cannot do anything with it now.
      pending.emailVerificationCode = random(64).toString()
      await dbSaveUserContact(pending, manager)

      user.emailId = pending.id
      user.emailContact = pending
      await dbSaveUser(user, manager)

      // EM-013: an address that was NEVER confirmed was never a key — not the GDT
      // anchor (EM-004 asks the oldest LIVING row), not anybody's. Left in place, a
      // mistyped address from an assisted registration would stay the oldest row and
      // point the GDT anchor at a typo forever; deleted hard, the member's real
      // address becomes the oldest. EM-007's precision covers this literally: "never
      // delete" protects rows that were ever valid.
      if (!oldContact.emailChecked && oldContact.id !== pending.id) {
        await dbDeleteUserContact(oldContact.id, manager)
      }

      // The record belongs to the change: neither without the other.
      await EVENT_EMAIL_CHANGE_CONFIRMED(user, manager)

      return { user, newEmail: pending.email, oldEmail, oldWasConfirmed, takeBack }
    })
    const { user, newEmail, oldEmail, oldWasConfirmed, takeBack } = settled
    logger.info('confirmEmailChange... marker moved')

    const common = { firstName: user.firstName, lastName: user.lastName, language: user.language }
    // Both addresses hear of it: the new one because it is now in force, the old one
    // because if this was not the member, this mail is their last chance to notice.
    await sendEmailChangeDoneEmail({
      ...common,
      email: newEmail,
      oldEmail,
      newEmail: newEmail,
    })
    // ... unless the old address never proved possession (EM-013): a never-confirmed
    // row belongs to nobody — mailing it would tell a stranger, or a typo.
    if (oldWasConfirmed) {
      await sendEmailChangeDoneEmail({
        ...common,
        email: oldEmail,
        oldEmail,
        newEmail: newEmail,
      })
    }

    // The support mailbox is where the GDT server and the newsletter get brought up to date
    // by hand. The oldest row is named because it is the address the GDT server is asked
    // with - that is the one to merge the new address into.
    const oldest = await dbFindOldestUserContact(user.id)
    await sendEmailChangeSupportEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: CONFIG.COMMUNITY_SUPPORT_MAIL,
      // ⛔ NOT `user.language`. This is the one mail the backend sends to a fixed
      // mailbox rather than to a member, and it had inherited the field from the nine
      // that do go to members - so a Turkish member's change back produced a Turkish
      // work order in the support inbox, and the one thing this mail exists to say
      // ("nothing to merge" against "please merge") became unreadable to whoever has to
      // act on it. A fixed language, and English is the one the house already uses for
      // everything not addressed to a member (see `apis/gms/GmsClient`). Bernd chose it
      // on 27.08.2026.
      language: 'en',
      alias: user.alias ?? '',
      oldEmail,
      newEmail: newEmail,
      gdtEmail: oldest?.email ?? oldEmail,
      takeBack,
      // EM-013 typo correction: the replaced address was never confirmed, so it was
      // never on the GDT server and never in Klick-Tipp — "merge the new address"
      // would ask the support to merge an address into itself.
      typoCorrection: !oldWasConfirmed,
    })
    logger.info('confirmEmailChange... mails sent')
    return newEmail
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
    // The search above only says WHOSE row this is; the decision is made again under the
    // lock. Whoever holds the veto link is told the truth: if the change was carried out or
    // withdrawn in the meantime, this code no longer stands for anything.
    await underMemberLock(pending.userId, async (manager) => {
      const locked = await dbFindPendingEmailChangeByVetoCode(vetoCode, manager)
      if (!locked) {
        logger.warn('the change this veto code belonged to was already gone')
        throw new LogError(CODE_INVALID)
      }
      await releasePending(locked, manager)
    })
    logger.info('revokeEmailChange... pending change dropped')
    return true
  }

  @Authorized([RIGHTS.MANAGE_OWN_EMAIL])
  @Mutation(() => Boolean)
  async cancelEmailChange(@Ctx() context: Context): Promise<boolean> {
    const logger = createLogger('cancelEmailChange')
    const user = getUser(context)
    logger.addContext('user', user.id)
    // Read under the lock, not before it: a cancel that decided on a row it read earlier
    // would write over a request the member made in the meantime - and the mail for that
    // request had already gone out.
    const dropped = await underMemberLock(user.id, async (manager) => {
      const pending = await dbFindPendingEmailChange(user.id, manager)
      if (!pending) {
        return false
      }
      await releasePending(pending, manager)
      return true
    })
    if (dropped) {
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
