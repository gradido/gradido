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
  dbGetUserById,
  dbInsertPendingEmailChange,
  dbLockUserRow,
  dbMarkUserContactPending,
  dbPurgeExpiredEmailChanges,
  dbReleasePendingEmailChange,
  dbSaveUser,
  dbSaveUserContact,
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
 * Both are shut by re-reading the row INSIDE the lock, which is what every caller here does.
 *
 * ⛔ Shut against writers that take the SAME lock, and against nothing else. That is a much
 * smaller claim than it reads like, so here is the counted list rather than an example:
 * NINE writers of `user_contacts` stand outside this lock.
 *  - Two hard DELETEs that cannot even be brought in, because neither takes an
 *    `EntityManager`: `dbReleaseUnconfirmedEmailChangeFor` (via `checkEmailExists`, from the
 *    registration, the assisted registration and the Elopage webhook) and
 *    `dbPurgeExpiredEmailChanges` (from `requestEmailChange` just before the lock, and from
 *    `adminReplaceUnconfirmedEmail`).
 *  - Six read-modify-writes that `save()` an entity read outside any transaction:
 *    `adminReplaceUnconfirmedEmail` here, `forgotPassword`, `setPassword` and
 *    `sendActivationEmail` in `UserResolver`, `confirmEmail` and `resendConfirmationEmail`
 *    in `AssistedRegistrationResolver`.
 * The DELETEs are right to stand outside - they are reached from a STRANGER's request, who
 * has no member to lock. The six saves are not; each can re-INSERT a row this file hard
 * deletes, id and `createdAt` and all, and TypeORM keeps an explicitly set auto-increment id
 * on MySQL. They are older than this file and are not repaired here, but they are the reason
 * this comment counts instead of illustrating.
 *
 * ⚠️ And the bound this comment used to assert was WRONG, which matters more than the count:
 * it said `user_contacts.email` is unique, so "one of the two hits the key and fails". That
 * presumes the confirm INSERTs. Under the lock it UPDATEs, so the key is never touched - see
 * the locking re-read in `confirmEmailChange`, which is what actually closes that window.
 *
 * TODO: this transaction boundary spans `users` (already in the Drizzle schema) and
 * `user_contacts` (not yet). Per AGENTS.md it moves to Drizzle only when BOTH do - a
 * transaction on one ORM does not cover writes on the other.
 */
const underMemberLock = <T>(userId: number, work: (manager: EntityManager) => Promise<T>) =>
  // The library's own transaction, not a hand-rolled query runner. It puts `startTransaction`
  // inside its try - ours sat outside it, so a transaction that failed to start never reached
  // `release()` and leaked its pooled connection, and the pool waits rather than erroring once
  // it is empty - and it wraps its rollback in a catch, so a rollback that fails on a dead
  // connection cannot replace the error that caused it.
  db
    .getDataSource()
    .transaction('REPEATABLE READ', async (manager) => {
      await dbLockUserRow(userId, manager)
      return work(manager)
    })

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
    let pending = await dbFindPendingEmailChange(user.id)
    if (!pending) {
      return null
    }
    if (!isEmailVerificationCodeValid(issuedAt(pending))) {
      // Ran past its window: it holds the address for nobody any more. Released under the
      // lock and on a row re-read there - opening the settings must not undo a change the
      // member started in another tab a moment ago.
      //
      // ⛔ And the re-read's ANSWER is carried back out, not thrown away. The lock waits for
      // a `requestEmailChange` that is in flight, so "the row was replaced while we waited"
      // is the ordinary case here, not a corner: whenever that happens this branch is
      // holding a FRESH change, correctly declines to release it - and used to report `null`
      // anyway. The member then saw no pending banner and no cancel button while the
      // confirmation mail was already in their inbox, asked again, and got "email already
      // sent less than ... ago" from the rate limit: two screens in a row contradicting each
      // other, with `cache-and-network` writing the wrong `null` over the cached truth.
      pending = await underMemberLock(user.id, async (manager) => {
        const locked = await dbFindPendingEmailChange(user.id, manager)
        if (!locked) {
          return null
        }
        if (!isEmailVerificationCodeValid(issuedAt(locked))) {
          await releasePending(locked, manager)
          return null
        }
        return locked
      })
      if (!pending) {
        return null
      }
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

    // A change somebody else started for this address and never finished must not block it.
    await dbPurgeExpiredEmailChanges(emailChangeExpiryCutoff(), email)

    // From the rate-limit read to the insert, the member's row is held under a lock: two
    // requests racing each other cannot both see "nothing pending" and both insert, nor
    // both slip through the window. One change at a time is an invariant, not a hope.
    // The rate limit itself lives on the event, not on the pending row: the row can be
    // cancelled and recreated at will, the event cannot.
    const { row: pending, currentContact } = await underMemberLock(user.id, async (manager) => {
      // The context user is a snapshot from before `verifyPassword` - hundreds of
      // milliseconds of Argon2id sit between it and this lock, and a confirm in another
      // tab can move the address in force inside that window. Everything that depends on
      // WHICH address is current - the guard below, and the mailbox the veto notice goes
      // to - is therefore decided on this read under the lock, never on the snapshot.
      // On the snapshot, the guard waved the current address through into the take-back
      // branch, which marked the row `users.email_id` points at as a change onto itself -
      // and the notice, with a working veto link, went to the mailbox the account had
      // just left.
      const lockedUser = await dbGetUserById(user.id, false, true, manager)
      if (email === lockedUser.emailContact.email.toLowerCase()) {
        throw new LogError('This is already the email address of this account')
      }

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
      // ONE look, not two. `email` is unique, so at most one row can hold it and its
      // `user_id` answers both questions at once. Asking them separately meant asking with
      // two different visibilities - `dbEmailTaken` counts deleted rows, the ownership
      // question did not - so the rule about deleted rows was invisible from both call
      // sites. What this buys is one source of truth, and that is all it buys.
      //
      // ⛔ It does NOT end "the member is told their OWN earlier address is in use", which
      // is what this comment claimed until the review of 27.08.2026 measured it. The `||`
      // below makes ownership irrelevant once `deletedAt` is set, so a soft-deleted row of
      // one's own is still refused - exactly as the two-lookup form refused it. And the case
      // is real data, not a hypothetical: migration 0055 back-filled
      // `user_contacts.deleted_at` from `users.deleted_at`, and `recover()` restores the
      // member without restoring those rows, so a member who was once deleted and recovered
      // hits it. Whether a soft-deleted row of one's own should be refused is a product
      // question - it is left as it has always been, but no longer described as fixed.
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
        // codes and a fresh window are right on the FIRST ask - the address is theirs
        // however this ends, so its window keeps nobody out.
        //
        // A REPEAT inside the window leaves the row untouched, like the two sibling doors
        // (`resendEmailChange`, and the fresh-row repeat below). That argument covered the
        // window and not the codes: rotating on a repeat killed the stop button in the
        // notice already delivered to the old address, and the write moved `updatedAt` -
        // the moment the whole change is measured from - so every repeat bought another
        // full window. The mails go out again with the codes and the deadline the change
        // already has.
        //
        // A run-out take-back is not a repeat: its notice promised the change would lapse,
        // so asking again starts a new change - fresh codes, fresh window, fresh notice.
        const repeatInFlight =
          own.emailOptInTypeId === OptInType.EMAIL_OPT_IN_CHANGE &&
          isEmailVerificationCodeValid(issuedAt(own))
        row = repeatInFlight ? own : await dbMarkUserContactPending(own, freshCodes(), manager)
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
      return { row, currentContact: lockedUser.emailContact }
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
    if (currentContact.emailChecked) {
      await sendEmailChangeNoticeEmail({
        firstName: user.firstName,
        lastName: user.lastName,
        email: currentContact.email,
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
      // ⚠️ The same door existed twice in `requestEmailChange` - asking again for the SAME
      // address, and repeating a take-back - and each wrote the row and bought the window
      // this branch refuses to buy. Both are shut now: a repeat inside the window leaves
      // the row untouched there too. What still renews a hold is cancelling and asking
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
    //
    // ⚠️ A refusal is RETURNED from in here, never thrown out of it - the same shape as in
    // `resendEmailChange`, and for the same reason. Releasing an expired row is not part of
    // what this caller asked for: that row is over however this request ends, so the release
    // has to outlive the refusal. Thrown from inside, it would roll back with the transaction
    // and leave the address held by a change that had already run out. Refusing something the
    // member DID ask for is the other case and belongs inside: `requestEmailChange` throws
    // over a lost race after releasing the previous change, and there the rollback is right -
    // the request did not happen, so nothing about it may stand.
    //
    // ⛔ The `.catch` at the bottom is not decoration, and consolidating the three
    // hand-written scaffolds into `underMemberLock` had dropped it. `CONFIRM_EMAIL_CHANGE` is
    // in `INALIENABLE_RIGHTS`, so the caller is anonymous; apollo-server 2 installs no
    // `formatError`, so whatever is thrown here IS the message the browser gets; and
    // `EmailChange.vue` prints `error.message` verbatim unless it reads `Invalid or expired
    // code`. Without it, a lock-wait timeout, a duplicate-entry naming a STRANGER's address,
    // or an `EntityNotFoundError` carrying the internal user id all land on the public
    // confirmation page. `LogError` is also what writes the log line, so dropping it meant
    // the failure was neither shown safely nor recorded at all.
    const settled = await underMemberLock(found.userId, async (manager) => {
      // ⛔ Read FOR UPDATE, not plainly. The member's `users` row is locked, this row is not,
      // and two deleters reach it without any lock at all. A snapshot read here would let a
      // delete committed in the meantime stay invisible until the save below silently
      // updated nothing - see `dbFindPendingEmailChangeByCode` for what that costs.
      const pending = await dbFindPendingEmailChangeByCode(code, manager, true)
      if (!pending) {
        logger.warn('the change this code belonged to was already gone')
        return null
      }
      if (!isEmailVerificationCodeValid(issuedAt(pending))) {
        await releasePending(pending, manager)
        logger.warn('code ran past its window')
        return null
      }

      // `UserContact.user` is the inverse of `users.email_id` and empty for a pending row;
      // the member is loaded by id - through the transaction's manager, so this read sees
      // what the lock is holding rather than whatever is committed beside it.
      const user = await dbGetUserById(pending.userId, false, true, manager)
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
    }).catch((e) => {
      throw new LogError('Error confirming the email change', e)
    })
    if (!settled) {
      // Raised after the transaction has committed, so the release above stands. Unknown,
      // withdrawn and expired all read the same from outside - there is nothing to tell apart.
      throw new LogError(CODE_INVALID)
    }
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
    //
    // ⚠️ The refusal is RETURNED and raised after the commit, like its two neighbours. It
    // could be thrown from inside today, because nothing is written before it - but this is
    // the one path with no expiry check, so the obvious next edit here is exactly the one
    // the neighbours already have (release a run-out change, then refuse), and thrown from
    // inside, that release would roll back. That is the regression this branch just
    // repaired; the safe shape is in place before the write arrives, not after.
    const released = await underMemberLock(pending.userId, async (manager) => {
      const locked = await dbFindPendingEmailChangeByVetoCode(vetoCode, manager)
      if (!locked) {
        logger.warn('the change this veto code belonged to was already gone')
        return false
      }
      await releasePending(locked, manager)
      return true
    })
    if (!released) {
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
    const user: DbUser = await dbGetUserById(userId, false, true)
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
    const user = await dbGetUserById(userId, false, true)
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
