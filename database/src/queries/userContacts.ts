// AI-GENERATED — not an architecture reference
import { and, asc, eq, getColumns, inArray, isNull, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Email, OptInType, Result } from 'shared'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { DbUserContact } from '../data'
import { AccountState } from '../enum'
import { DBDuplicateEntryError, DBInsertFailed, isDuplicateEntry } from '../errorTypes'
import {
  UserContactInsert,
  UserContactSelect,
  userContactsTable,
  usersTable,
} from '../schemas/drizzle.schema'

// Drizzle only. The `user_contacts` queries still on TypeORM live in
// `./userContacts.typeorm` - the ones that take or return the entity, and the ones that join
// a caller's TypeORM transaction. The life of a row is described there.
//
// Wherever TypeORM read `user_contacts` as its main table it added `deleted_at IS NULL` on
// its own (the entity has a `@DeleteDateColumn`); Drizzle adds nothing, so the reads below
// spell that condition out. TypeORM's delete query builder never added it, so the deletes
// below do not either.
//
const userContactInsertFailed = (row: UserContactInsert) =>
  new DBInsertFailed<UserContactInsert>('user_contacts', row)

export async function dbInsertUserContact(
  userContact: UserContactInsert,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<Result<number, DBInsertFailed<UserContactInsert> | DBDuplicateEntryError>> {
  try {
    const rows = await tx.insert(userContactsTable).values(userContact)
    const firstRow = rows[0]
    if (firstRow && firstRow.affectedRows === 1) {
      return { success: true, value: firstRow.insertId }
    }
    return { success: false, error: userContactInsertFailed(userContact) }
  } catch (error) {
    // The address or the verification code is taken already; which of the two, the caller
    // asks with dbIsUserContactFieldExist.
    if (isDuplicateEntry(error)) {
      return {
        success: false,
        error: new DBDuplicateEntryError(
          'user_contacts',
          'email | email_verification_code',
          `${userContact.email} | ${userContact.emailVerificationCode}`,
        ),
      }
    }
    throw error
  }
}

export async function dbUserContactUpdateField<K extends keyof UserContactInsert>(
  userContactId: number,
  field: K,
  value: UserContactInsert[K],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number> {
  const rows = await tx
    .update(userContactsTable)
    .set({
      [field]: value,
    })
    .where(eq(userContactsTable.id, userContactId))
  return rows[0] ? rows[0].affectedRows : 0
}

export async function dbUserContactUpdate(
  userContactId: number,
  values: Partial<UserContactInsert>,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number> {
  const rows = await tx
    .update(userContactsTable)
    .set(values)
    .where(eq(userContactsTable.id, userContactId))
  return rows[0] ? rows[0].affectedRows : 0
}

export async function dbFindUserContact(
  userContactId: number,
  withDeleted = false,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<UserContactSelect | null> {
  const rows = await tx
    .select()
    .from(userContactsTable)
    .where(
      withDeleted
        ? eq(userContactsTable.id, userContactId)
        : and(eq(userContactsTable.id, userContactId), isNull(userContactsTable.deletedAt)),
    )
  return rows[0] ?? null
}

/**
 * The live row behind a code, if it is of one of `optInTypes`, with the member whose
 * address it is. setPassword asks for REGISTER and RESET_PASSWORD only: a pending e-mail
 * change carries a code of the same kind, but that code confirms an address and must not
 * set a password.
 *
 * ⚠️ `user` is joined over `users.email_id`, so it is null for every row that is not the
 * member's current address - a row keeps its code when the member moves on to another
 * one. The caller has to check it.
 *
 * A deleted contact finds nothing, and so does a deleted member. The TypeORM lookup this
 * replaces handed out the row without its member in the second case; setPassword answers
 * both the same way.
 */
export async function dbFindUserContactByCodeAndTypes(
  code: bigint,
  optInTypes: OptInType[],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<DbUserContact | undefined> {
  const rows = await tx
    .select({ ...getColumns(userContactsTable), user: usersTable })
    .from(userContactsTable)
    .leftJoin(usersTable, eq(usersTable.emailId, userContactsTable.id))
    .where(
      and(
        eq(userContactsTable.emailVerificationCode, code),
        inArray(userContactsTable.emailOptInTypeId, optInTypes),
        isNull(userContactsTable.deletedAt),
        isNull(usersTable.deletedAt),
      ),
    )
  return rows[0]
}

/**
 * The row of an address, with the member whose current address it is (`user` is null
 * otherwise, as in dbFindUserContactByCodeAndTypes). A deleted contact or member finds
 * nothing, unless `withDeleted` - then the row comes whatever its state, which is the
 * visibility `dbEmailTaken` and the change-back in requestEmailChange ask with.
 */
export async function dbFindUserContactWithUserByEmail(
  email: Email,
  withDeleted = false,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<DbUserContact | undefined> {
  const whereWithoutDeleted = and(
    eq(userContactsTable.email, email),
    isNull(userContactsTable.deletedAt),
    isNull(usersTable.deletedAt),
  )
  const whereWithDeleted = eq(userContactsTable.email, email)
  const rows = await tx
    .select({ ...getColumns(userContactsTable), user: usersTable })
    .from(userContactsTable)
    .leftJoin(usersTable, eq(usersTable.emailId, userContactsTable.id))
    .where(withDeleted ? whereWithDeleted : whereWithoutDeleted)
  return rows[0]
}

/**
 * Every address this member has CONFIRMED, oldest first. A pending change is left out on
 * purpose: an address that was merely typed in must not answer anything on the member's
 * behalf - not even whether it ever bought something.
 */
export async function dbFindConfirmedUserContactEmails(userId: number): Promise<string[]> {
  const rows = await drizzleDb()
    .select({ email: userContactsTable.email })
    .from(userContactsTable)
    .where(
      and(
        eq(userContactsTable.userId, userId),
        eq(userContactsTable.emailChecked, true),
        isNull(userContactsTable.deletedAt),
      ),
    )
    .orderBy(asc(userContactsTable.createdAt))
  return rows.map((row) => row.email)
}

export async function dbIsUserContactFieldExist<K extends keyof UserContactInsert>(
  field: K,
  value: UserContactInsert[K],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<number> {
  if (!value) {
    throw new Error('empty value given')
  }
  const rows = await tx
    .select({ id: userContactsTable.id })
    .from(userContactsTable)
    .where(eq(userContactsTable[field], value))
  return rows[0] ? rows[0].id : 0
}

// Not a soft delete, really remove the user from db, without side effects, used in RegisterUser if something after creating user failed
export async function dbRemoveUserContact(userContactId: number): Promise<number> {
  if (userContactId) {
    const rows = await drizzleDb()
      .delete(userContactsTable)
      .where(eq(userContactsTable.id, userContactId))
    return rows[0] ? rows[0].affectedRows : 0
  }
  return 0
}

/**
 * Remove the pending changes that ran past their window, so the addresses they hold are
 * free again - for one address, or for everybody when none is given. The window is
 * counted from the last time a code went out, which is `updated_at` once the row was
 * touched and `created_at` before. Hard delete, see the file comment in
 * `./userContacts.typeorm`. Returns how many rows went.
 *
 * `olderThan` goes to the driver as it is, not through the column's mapping: Drizzle
 * would write a `datetime` column's value as UTC, mysql2 writes a bare Date in the
 * connection's time zone - which is what the TypeORM version sent.
 */
export async function dbPurgeExpiredEmailChanges(olderThan: Date, email?: string): Promise<number> {
  const result = await drizzleDb()
    .delete(userContactsTable)
    .where(
      and(
        eq(userContactsTable.emailOptInTypeId, OptInType.EMAIL_OPT_IN_CHANGE),
        // Only fresh rows. A take-back is one of the member's own confirmed addresses and is
        // never deleted; it is restored by the paths that know whose it is.
        eq(userContactsTable.emailChecked, false),
        sql`COALESCE(${userContactsTable.updatedAt}, ${userContactsTable.createdAt}) < ${olderThan}`,
        email ? eq(userContactsTable.email, email) : undefined,
      ),
    )
  return result[0]?.affectedRows ?? 0
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
export async function dbReleaseUnconfirmedEmailChangeFor(
  email: string,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<number> {
  if (!tx) {
    tx = drizzleDb()
  }
  const result = await tx
    .delete(userContactsTable)
    .where(
      and(
        eq(userContactsTable.emailOptInTypeId, OptInType.EMAIL_OPT_IN_CHANGE),
        eq(userContactsTable.emailChecked, false),
        eq(userContactsTable.email, email),
      ),
    )
  return result[0]?.affectedRows ?? 0
}

/**
 * Confirms the address of a registration and marks its owner ACTIVATED, in one statement - the
 * address and the state are not to be seen apart, and a multi-table UPDATE is atomic without a
 * transaction around it.
 *
 * Only for the current address of its account (`users.email_id`): a row the member typed in
 * and never took over changes nothing, neither itself nor anybody's state. `updated_at` is set
 * by the column's own ON UPDATE.
 *
 * @returns the rows matched: 2 (the contact and its account), also when both were confirmed
 * already - mysql2 connects with FOUND_ROWS, so matched rows count, not changed ones. 0 means
 * there is no such current address.
 */
export async function dbConfirmRegistrationContact(contactId: number): Promise<number> {
  const rows = await drizzleDb().execute(
    sql`UPDATE ${usersTable}, ${userContactsTable} 
      SET ${userContactsTable.emailChecked} = true, ${usersTable.accountState} = ${AccountState.ACTIVATED}
      WHERE ${userContactsTable.id} = ${contactId} AND ${usersTable.emailId} = ${userContactsTable.id}
    `,
  )
  return rows[0] ? rows[0].affectedRows : 0
}

// One statement for all the rows it is given
export async function dbInsertUserContacts(
  userContacts: UserContactInsert[],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<void> {
  if (userContacts.length === 0) {
    return
  }
  await tx.insert(userContactsTable).values(userContacts)
}
