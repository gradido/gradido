// AI-GENERATED — not an architecture reference
import { OptInType, Result, UserContactType, VoidResult } from 'shared'
import { EntityManager, Like } from 'typeorm'
import { UserContact as DbUserContact } from '../entity'
import { DBDuplicateEntryError, DBNotFoundError } from '../errorTypes'

/**
 * A member's addresses. `users.email_id` marks the one that counts; every row that ever
 * held an address of theirs STAYS: the oldest living row is the key the GDT server knows
 * them by, and a row that vanished would let the Elopage webhook open a second account on
 * the next subscription event.
 *
 * A pending change is a second row of opt-in type EMAIL_OPT_IN_CHANGE with
 * `emailChecked = false`. Confirming it moves the marker; cancelling, vetoing or expiry
 * deletes it HARD - a soft-deleted row would still block the address for everybody,
 * because the registration check looks at deleted rows too.
 *
 * Same rule as in `userAliases.ts`: whatever the caller writes inside its REPEATABLE READ
 * transaction takes the optional `EntityManager`, so a rollback of `users` takes the
 * contact row with it.
 */

const UserContactNotFound = (where: string) => new DBNotFoundError('user_contacts', where)

const isDuplicateEntry = (error: unknown): boolean => {
  const code = (error as { code?: string; driverError?: { code?: string } } | null) ?? {}
  return code.code === 'ER_DUP_ENTRY' || code.driverError?.code === 'ER_DUP_ENTRY'
}

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
  const where = {
    userId,
    emailOptInTypeId: OptInType.EMAIL_OPT_IN_CHANGE,
    emailChecked: false,
  }
  return manager ? manager.findOne(DbUserContact, { where }) : DbUserContact.findOne({ where })
}

/**
 * A pending change by the code from the confirmation mail. Only that kind of row: a
 * registration or reset code must not confirm a change, and the inverse holds in the
 * password paths. No relation is loaded here - `UserContact.user` is the inverse of
 * `users.email_id` and therefore empty for a pending row; load the member by `userId`.
 */
export async function dbFindPendingEmailChangeByCode(code: string): Promise<DbUserContact | null> {
  return DbUserContact.findOne({
    where: {
      emailVerificationCode: code,
      emailOptInTypeId: OptInType.EMAIL_OPT_IN_CHANGE,
      emailChecked: false,
    },
  })
}

/** A pending change by the veto code from the notice to the old address. */
export async function dbFindPendingEmailChangeByVetoCode(
  vetoCode: string,
): Promise<DbUserContact | null> {
  return DbUserContact.findOne({
    where: {
      changeVetoCode: vetoCode,
      emailOptInTypeId: OptInType.EMAIL_OPT_IN_CHANGE,
      emailChecked: false,
    },
  })
}

/**
 * Is this address spoken for? Deleted rows count too - that is how the registration has
 * always checked (`checkEmailExists`), and it is what keeps a recycled address from
 * inheriting anything.
 */
export async function dbEmailTaken(email: string): Promise<boolean> {
  return (await DbUserContact.findOne({ where: { email }, withDeleted: true })) !== null
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
    .andWhere('email_checked = 0')
    .andWhere('COALESCE(updated_at, created_at) < :before', { before: olderThan })
  if (email) {
    query.andWhere('email = :email', { email })
  }
  const result = await query.execute()
  return result.affected ?? 0
}

/**
 * The row a change starts with: the new address, unconfirmed, both codes set. Two members
 * racing for the same address meet the unique key here - that is an expected outcome, not
 * a crash.
 */
export async function dbInsertPendingEmailChange(row: {
  userId: number
  email: string
  verificationCode: string
  vetoCode: string
}): Promise<Result<DbUserContact, DBDuplicateEntryError>> {
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
    return { success: true, value: await DbUserContact.save(contact) }
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
