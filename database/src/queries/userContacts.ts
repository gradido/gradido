// AI-GENERATED — not an architecture reference
import { OptInType, Result, UserContactType, VoidResult } from 'shared'
import { EntityManager, Like } from 'typeorm'
import { UserContact as DbUserContact } from '../entity'
import { DBDuplicateEntryError, DBNotFoundError, isDuplicateEntry } from '../errorTypes'

/**
 * A member's addresses. `users.email_id` marks the one that counts; every row that ever
 * held an address of theirs STAYS: the oldest living row is the key the GDT server knows
 * them by, and a row that vanished would let the Elopage webhook open a second account on
 * the next subscription event.
 *
 * A pending change is the row of opt-in type EMAIL_OPT_IN_CHANGE. Confirming it moves the
 * marker; cancelling, vetoing or expiry releases it again.
 *
 * There are two kinds of pending row, and they end differently:
 *  - A FRESH one, inserted for an address the member never had: `emailChecked = false`.
 *    Released by a HARD delete - a soft-deleted row would still block the address for
 *    everybody, because the registration check looks at deleted rows too.
 *  - A TAKE-BACK: the member's OWN earlier row, borrowed for the change. `email` is
 *    unique, so a second row with that address cannot exist; going back to an address one
 *    already held means re-pointing `users.email_id` at the row that is already there.
 *    It carries `emailChecked = true` and is released by RESTORING it, never by deleting -
 *    it is history, and history stays (see above).
 *
 * ⛔ Which is why a settled row must not keep the CHANGE type: after a confirmation the row
 * is simply a confirmed address again (type REGISTER). Otherwise every address the member
 * ever changed to would look like a change in flight.
 *
 * Same rule as in `userAliases.ts`: whatever the caller writes inside its REPEATABLE READ
 * transaction takes the optional `EntityManager`, so a rollback of `users` takes the
 * contact row with it.
 */

const UserContactNotFound = (where: string) => new DBNotFoundError('user_contacts', where)

/** The oldest living address of this member - the one the GDT server is asked with. */
export async function dbFindOldestUserContact(userId: number): Promise<DbUserContact | null> {
  return DbUserContact.findOne({ where: { userId }, order: { createdAt: 'ASC' } })
}

/**
 * Every address this member has CONFIRMED, oldest first. A pending change is left out on
 * purpose: an address that was merely typed in must not answer anything on the member's
 * behalf - not even whether it ever bought something.
 */
export async function dbFindConfirmedUserContactEmails(userId: number): Promise<string[]> {
  const rows = await DbUserContact.find({
    where: { userId, emailChecked: true },
    order: { createdAt: 'ASC' },
  })
  return rows.map((row) => row.email)
}

/**
 * The members who hold an address containing this text - under ANY of their rows, current,
 * earlier or pending - each id once. This is how the admin search finds somebody by the
 * address the GDT server still knows them by. Not a join: `User.userContacts` has no
 * usable join column (its inverse side is the `email_id` relation), so the ids are looked
 * up here and handed to the user query.
 */
export async function dbFindUserIdsByEmailLike(searchCriteria: string): Promise<number[]> {
  const rows = await DbUserContact.find({
    select: { userId: true },
    where: { email: Like(`%${searchCriteria}%`) },
  })
  return [...new Set(rows.map((row) => row.userId))]
}

/** The change this member has under way, if any. */
export async function dbFindPendingEmailChange(
  userId: number,
  manager?: EntityManager,
): Promise<DbUserContact | null> {
  // The type alone says it: a settled row is put back to REGISTER when it is confirmed,
  // so nothing but a change in flight carries CHANGE - fresh or taken back.
  const where = { userId, emailOptInTypeId: OptInType.EMAIL_OPT_IN_CHANGE }
  return manager ? manager.findOne(DbUserContact, { where }) : DbUserContact.findOne({ where })
}

/**
 * A pending change by the code from the confirmation mail. Only that kind of row: a
 * registration or reset code must not confirm a change, and the inverse holds in the
 * password paths. No relation is loaded here - `UserContact.user` is the inverse of
 * `users.email_id` and therefore empty for a pending row; load the member by `userId`.
 *
 * ⛔ `forUpdate` is what makes a read-then-write on this row safe, and it takes a lock on
 * THIS row - the member's `users` row is a different row and does not protect it. A plain
 * read under REPEATABLE READ serves the snapshot, so a hard DELETE committed by one of the
 * unlocked deleters after that read stays invisible: the caller's `save()` then finds a row
 * in its snapshot, chooses UPDATE over INSERT, matches zero rows, and TypeORM does not look
 * at `affected`. The member ends up with `users.email_id` pointing at a row that is gone and
 * cannot log in at all, having just been mailed that the change succeeded. A locking read
 * reads the latest committed version instead: the delete either blocks until this
 * transaction ends, or has already happened and the row is correctly not found.
 */
export async function dbFindPendingEmailChangeByCode(
  code: string,
  manager?: EntityManager,
  forUpdate = false,
): Promise<DbUserContact | null> {
  const options = {
    where: {
      emailVerificationCode: code,
      emailOptInTypeId: OptInType.EMAIL_OPT_IN_CHANGE,
    },
    ...(forUpdate ? { lock: { mode: 'pessimistic_write' as const } } : {}),
  }
  return manager ? manager.findOne(DbUserContact, options) : DbUserContact.findOne(options)
}

/** A pending change by the veto code from the notice to the old address. */
export async function dbFindPendingEmailChangeByVetoCode(
  vetoCode: string,
  manager?: EntityManager,
): Promise<DbUserContact | null> {
  const options = {
    where: {
      changeVetoCode: vetoCode,
      emailOptInTypeId: OptInType.EMAIL_OPT_IN_CHANGE,
    },
  }
  return manager ? manager.findOne(DbUserContact, options) : DbUserContact.findOne(options)
}

/**
 * Is this address spoken for? Deleted rows count too - that is how the registration has
 * always checked (`checkEmailExists`), and it is what keeps a recycled address from
 * inheriting anything.
 */
export async function dbEmailTaken(email: string, manager?: EntityManager): Promise<boolean> {
  return (await dbFindUserContactByEmail(email, manager)) !== null
}

/**
 * The one row that can hold this address - `email` is unique, so there is at most one, and
 * its `user_id` says whose it is.
 *
 * ⛔ Deleted rows are included, and that is the whole reason this exists as ONE question.
 * Asking "is it taken" and "is it mine" separately meant asking with two different
 * visibilities: `dbEmailTaken` counts deleted rows, the ownership question did not.
 * The moment anything soft-deletes a contact row, those two disagree - and a member is told
 * their OWN earlier address is already in use, which is the very thing the change-back was
 * built to end.
 */
export async function dbFindUserContactByEmail(
  email: string,
  manager?: EntityManager,
): Promise<DbUserContact | null> {
  const options = { where: { email }, withDeleted: true }
  return manager ? manager.findOne(DbUserContact, options) : DbUserContact.findOne(options)
}

/**
 * Remove the pending changes that ran past their window, so the addresses they hold are
 * free again - for one address, or for everybody when none is given. The window is
 * counted from the last time a code went out, which is `updated_at` once the row was
 * touched and `created_at` before. Hard delete, see the file comment. Returns how many
 * rows went.
 */
export async function dbPurgeExpiredEmailChanges(olderThan: Date, email?: string): Promise<number> {
  const query = DbUserContact.createQueryBuilder()
    .delete()
    .from(DbUserContact)
    .where('email_opt_in_type_id = :type', { type: OptInType.EMAIL_OPT_IN_CHANGE })
    // Only fresh rows. A take-back is one of the member's own confirmed addresses and is
    // never deleted; it is restored by the paths that know whose it is.
    .andWhere('email_checked = 0')
    .andWhere('COALESCE(updated_at, created_at) < :before', { before: olderThan })
  if (email) {
    query.andWhere('email = :email', { email })
  }
  const result = await query.execute()
  return result.affected ?? 0
}

/**
 * Give up every never-confirmed change that is holding this address - however young.
 *
 * ⛔ This is NOT the same question as `dbPurgeExpiredEmailChanges`, and the difference is
 * the whole point. That one tidies away claims that ran out of time. This one settles a
 * conflict between two claims on the SAME address: a pending change is somebody who TYPED
 * the address in, a registration is somebody who is about to be sent mail at it and has to
 * answer it. The typed claim yields.
 *
 * Without that, the typed claim wins - silently, and for as long as it is renewed. It kept
 * the address from whoever actually holds the mailbox, and it closed the Elopage webhook for
 * a paying buyer whose address a stranger had once typed into a change form.
 *
 * A CONFIRMED row is never touched: that address is proven, and it stays its owner's - which
 * is also why a take-back (a member's own earlier address, borrowed) survives this.
 */
export async function dbReleaseUnconfirmedEmailChangeFor(email: string): Promise<number> {
  const result = await DbUserContact.createQueryBuilder()
    .delete()
    .from(DbUserContact)
    .where('email_opt_in_type_id = :type', { type: OptInType.EMAIL_OPT_IN_CHANGE })
    .andWhere('email_checked = 0')
    .andWhere('email = :email', { email })
    .execute()
  return result.affected ?? 0
}

/**
 * The row a change starts with: the new address, unconfirmed, both codes set. Two members
 * racing for the same address meet the unique key here - that is an expected outcome, not
 * a crash.
 */
export async function dbInsertPendingEmailChange(
  row: {
    userId: number
    email: string
    verificationCode: string
    vetoCode: string
  },
  manager?: EntityManager,
): Promise<Result<DbUserContact, DBDuplicateEntryError>> {
  const contact = DbUserContact.create({
    userId: row.userId,
    email: row.email,
    type: UserContactType.USER_CONTACT_EMAIL,
    emailChecked: false,
    emailOptInTypeId: OptInType.EMAIL_OPT_IN_CHANGE,
    emailVerificationCode: row.verificationCode,
    changeVetoCode: row.vetoCode,
  })
  try {
    const saved = manager ? await manager.save(contact) : await DbUserContact.save(contact)
    return { success: true, value: saved }
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return {
        success: false,
        error: new DBDuplicateEntryError('user_contacts', 'email', row.email),
      }
    }
    throw error
  }
}

/**
 * Borrow one of the member's OWN earlier rows for a change back to that address. The row
 * keeps `emailChecked` - it is and stays a confirmed address of theirs - and only takes on
 * the change type and the two fresh codes.
 */
export async function dbMarkUserContactPending(
  contact: DbUserContact,
  codes: { verificationCode: string; vetoCode: string },
  manager?: EntityManager,
): Promise<DbUserContact> {
  contact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_CHANGE
  contact.emailVerificationCode = codes.verificationCode
  contact.changeVetoCode = codes.vetoCode
  contact.updatedAt = new Date()
  return manager ? manager.save(contact) : DbUserContact.save(contact)
}

/**
 * End a pending change without carrying it out - cancelled, vetoed or expired. A fresh row
 * goes for good; a taken-back row is put back to what it was, because it is one of the
 * member's addresses and those are never deleted.
 *
 * ⛔ The fresh verification code is not cosmetic. A restored row carries the REGISTER type
 * again, and `setPassword` accepts any code whose row is not of the change type - so
 * leaving the mailed code in place would turn a cancelled change into a working
 * activation ticket for whoever still holds that link.
 */
export async function dbReleasePendingEmailChange(
  contact: DbUserContact,
  freshVerificationCode: string,
  manager?: EntityManager,
): Promise<'restored' | 'deleted'> {
  if (!contact.emailChecked) {
    await (manager
      ? manager.delete(DbUserContact, { id: contact.id })
      : DbUserContact.delete({ id: contact.id }))
    return 'deleted'
  }
  contact.emailOptInTypeId = OptInType.EMAIL_OPT_IN_REGISTER
  contact.emailVerificationCode = freshVerificationCode
  contact.changeVetoCode = null
  contact.updatedAt = new Date()
  await (manager ? manager.save(contact) : DbUserContact.save(contact))
  return 'restored'
}

/** Persist changes to a contact row - inside the caller's transaction when given. */
export async function dbSaveUserContact(
  contact: DbUserContact,
  manager?: EntityManager,
): Promise<DbUserContact> {
  return manager ? manager.save(contact) : DbUserContact.save(contact)
}

/** Hard-delete one contact row: a pending change that was cancelled, vetoed or replaced. */
export async function dbDeleteUserContact(
  id: number,
  manager?: EntityManager,
): Promise<VoidResult<DBNotFoundError>> {
  const result = manager
    ? await manager.delete(DbUserContact, { id })
    : await DbUserContact.delete({ id })
  if (result.affected === 1) {
    return { success: true }
  }
  return { success: false, error: UserContactNotFound(`id = ${id}`) }
}
