// AI-GENERATED — not an architecture reference
import { eq, inArray } from 'drizzle-orm'
import { OptInType, UserContactType } from 'shared'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { AccountState } from '../enum'
import { DBDuplicateEntryError } from '../errorTypes'
import { userContactsTable, usersTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { userFactoryDrizzle } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { peterLustig } from '../seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '../seeds/users/raeuber-hotzenplotz'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import { DbUser } from './user'
import {
  dbConfirmRegistrationContact,
  dbFindConfirmedUserContactEmails,
  dbFindUserContact,
  dbFindUserContactByCodeAndTypes,
  dbFindUserContactWithUserByEmail,
  dbInsertUserContact,
  dbIsUserContactFieldExist,
  dbPurgeExpiredEmailChanges,
  dbReleaseUnconfirmedEmailChangeFor,
  dbRemoveUserContact,
  dbUserContactUpdate,
  dbUserContactUpdateField,
} from './userContacts'

/**
 * What the Drizzle translation had to write out by hand: TypeORM added `deleted_at IS NULL`
 * to every read on its own, and left it off its deletes. The scenarios these queries take
 * part in - a change, its expiry, a registration taking an address back - are tested in
 * `userContacts.typeorm.test.ts`.
 */

const appDB = AppDatabase.getInstance()
const HOUR_MS = 60 * 60 * 1000
const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR_MS)

async function insertContact(row: {
  userId: number
  email: string
  emailChecked: boolean
  optInType: OptInType
  code?: bigint
  createdAt?: Date
  updatedAt?: Date | null
  deletedAt?: Date | null
}): Promise<number> {
  const result = await drizzleDb()
    .insert(userContactsTable)
    .values({
      userId: row.userId,
      email: row.email,
      type: UserContactType.USER_CONTACT_EMAIL,
      emailChecked: row.emailChecked ? 1 : 0,
      emailOptInTypeId: row.optInType,
      emailVerificationCode: row.code ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? null,
      deletedAt: row.deletedAt ?? null,
    })
  return result[0].insertId
}

async function remainingEmails(emails: string[]): Promise<string[]> {
  const rows = await drizzleDb()
    .select({ email: userContactsTable.email })
    .from(userContactsTable)
    .where(inArray(userContactsTable.email, emails))
  return rows.map((row) => row.email).sort()
}

beforeAll(async () => {
  await appDB.init()
})

afterAll(async () => {
  await appDB.destroy()
})

describe('userContacts.queries', () => {
  let bibi: DbUser
  let peter: DbUser

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()

    await createCommunity(false)
    bibi = await userFactoryDrizzle(bibiBloxberg)
    peter = await userFactoryDrizzle(peterLustig)

    // Inserted after the registration row but dated before it: the order has to come from
    // `created_at`, not from the id.
    await insertContact({
      userId: bibi.id,
      email: 'bibi-first@bloxberg.de',
      emailChecked: true,
      optInType: OptInType.EMAIL_OPT_IN_REGISTER,
      createdAt: new Date(2000, 0, 1),
    })
    await insertContact({
      userId: bibi.id,
      email: 'bibi-typed@bloxberg.de',
      emailChecked: false,
      optInType: OptInType.EMAIL_OPT_IN_CHANGE,
    })
    await insertContact({
      userId: bibi.id,
      email: 'bibi-gone@bloxberg.de',
      emailChecked: true,
      optInType: OptInType.EMAIL_OPT_IN_REGISTER,
      deletedAt: new Date(),
    })
  })

  describe('dbFindConfirmedUserContactEmails', () => {
    it('lists the confirmed addresses oldest first - nothing typed in, nothing deleted', async () => {
      expect(await dbFindConfirmedUserContactEmails(bibi.id)).toEqual([
        'bibi-first@bloxberg.de',
        'bibi@bloxberg.de',
      ])
      expect(await dbFindConfirmedUserContactEmails(peter.id)).toEqual(['peter@lustig.de'])
    })
  })

  describe('dbPurgeExpiredEmailChanges', () => {
    const emails = [
      'expired@purge.test',
      'renewed@purge.test',
      'young@purge.test',
      'taken-back@purge.test',
      'registration@purge.test',
      'deleted@purge.test',
    ]

    beforeAll(async () => {
      const change = { userId: peter.id, optInType: OptInType.EMAIL_OPT_IN_CHANGE }
      await insertContact({
        ...change,
        email: emails[0],
        emailChecked: false,
        createdAt: hoursAgo(25),
      })
      // Old, but a code went out an hour ago - the window counts from there.
      await insertContact({
        ...change,
        email: emails[1],
        emailChecked: false,
        createdAt: hoursAgo(25),
        updatedAt: hoursAgo(1),
      })
      await insertContact({
        ...change,
        email: emails[2],
        emailChecked: false,
        createdAt: hoursAgo(1),
      })
      await insertContact({
        ...change,
        email: emails[3],
        emailChecked: true,
        createdAt: hoursAgo(25),
      })
      await insertContact({
        userId: peter.id,
        email: emails[4],
        emailChecked: false,
        optInType: OptInType.EMAIL_OPT_IN_REGISTER,
        createdAt: hoursAgo(25),
      })
      // A soft-deleted pending row still holds its address against everybody (the
      // registration check counts deleted rows), so it has to go like any other.
      await insertContact({
        ...change,
        email: emails[5],
        emailChecked: false,
        createdAt: hoursAgo(25),
        deletedAt: hoursAgo(2),
      })
    })

    it('narrowed to one address, removes nothing else', async () => {
      expect(await dbPurgeExpiredEmailChanges(hoursAgo(24), emails[0])).toBe(1)
      expect(await remainingEmails(emails)).toEqual([...emails.slice(1)].sort())
    })

    it('removes the fresh changes past the window, deleted ones included, and only those', async () => {
      expect(await dbPurgeExpiredEmailChanges(hoursAgo(24))).toBe(1)
      expect(await remainingEmails(emails)).toEqual(
        [
          'renewed@purge.test',
          'young@purge.test',
          'taken-back@purge.test',
          'registration@purge.test',
        ].sort(),
      )
    })
  })

  describe('dbReleaseUnconfirmedEmailChangeFor', () => {
    it('gives up an unconfirmed change on the address, however young', async () => {
      await insertContact({
        userId: bibi.id,
        email: 'wanted@release.test',
        emailChecked: false,
        optInType: OptInType.EMAIL_OPT_IN_CHANGE,
      })
      expect(await dbReleaseUnconfirmedEmailChangeFor('wanted@release.test')).toBe(1)
      expect(await remainingEmails(['wanted@release.test'])).toEqual([])
    })

    // The registration releases inside its own transaction: seen there at once, and gone
    // for everybody only once that transaction commits.
    it('releases inside the transaction it is given', async () => {
      await insertContact({
        userId: bibi.id,
        email: 'pending@release.test',
        emailChecked: false,
        optInType: OptInType.EMAIL_OPT_IN_CHANGE,
      })
      await drizzleDb().transaction(async (tx) => {
        expect(await dbReleaseUnconfirmedEmailChangeFor('pending@release.test', tx)).toBe(1)
      })
      expect(await remainingEmails(['pending@release.test'])).toEqual([])
    })

    it('never touches a confirmed row or a registration', async () => {
      await insertContact({
        userId: bibi.id,
        email: 'proven@release.test',
        emailChecked: true,
        optInType: OptInType.EMAIL_OPT_IN_CHANGE,
      })
      await insertContact({
        userId: bibi.id,
        email: 'registering@release.test',
        emailChecked: false,
        optInType: OptInType.EMAIL_OPT_IN_REGISTER,
      })
      expect(await dbReleaseUnconfirmedEmailChangeFor('proven@release.test')).toBe(0)
      expect(await dbReleaseUnconfirmedEmailChangeFor('registering@release.test')).toBe(0)
      expect(await remainingEmails(['proven@release.test', 'registering@release.test'])).toEqual([
        'proven@release.test',
        'registering@release.test',
      ])
    })
  })

  describe('dbConfirmRegistrationContact', () => {
    let guest: DbUser

    const stateOf = async (userId: number) =>
      (
        await drizzleDb()
          .select({ accountState: usersTable.accountState })
          .from(usersTable)
          .where(eq(usersTable.id, userId))
      )[0].accountState

    const contactOf = async (contactId: number) =>
      (
        await drizzleDb()
          .select({
            emailChecked: userContactsTable.emailChecked,
            updatedAt: userContactsTable.updatedAt,
          })
          .from(userContactsTable)
          .where(eq(userContactsTable.id, contactId))
      )[0]

    beforeAll(async () => {
      guest = await userFactoryDrizzle({
        alias: 'GuestC',
        email: 'guest@confirm.test',
        firstName: 'Guest',
        lastName: 'Confirm',
        emailChecked: false,
      })
    })

    it('confirms the address and activates its owner, in one statement', async () => {
      expect(await stateOf(guest.id)).toBe(AccountState.REGISTERED)

      // Both rows of the one statement: the contact and the account.
      expect(await dbConfirmRegistrationContact(guest.emailId!)).toBe(2)

      expect(await contactOf(guest.emailId!)).toEqual({
        emailChecked: true,
        // Set by the column's own ON UPDATE, as a TypeORM save() did it before.
        updatedAt: expect.any(Date),
      })
      expect(await stateOf(guest.id)).toBe(AccountState.ACTIVATED)
    })

    // `users.email_id` is what makes a row the member's address: a row they typed in and
    // never took over belongs to nobody's account state.
    it('touches nothing for a row that is not the current address of its account', async () => {
      const typed = await insertContact({
        userId: peter.id,
        email: 'peter-typed@confirm.test',
        emailChecked: false,
        optInType: OptInType.EMAIL_OPT_IN_CHANGE,
      })
      const peterBefore = await stateOf(peter.id)

      expect(await dbConfirmRegistrationContact(typed)).toBe(0)

      expect((await contactOf(typed)).emailChecked).toBe(false)
      expect(await stateOf(peter.id)).toBe(peterBefore)
    })

    // mysql2 connects with FOUND_ROWS: the count is of the rows matched, not changed. A second
    // confirmation changes nothing and still counts both, so 0 means "no such current address"
    // and nothing else.
    it('counts both rows again for an address confirmed already', async () => {
      expect(await dbConfirmRegistrationContact(guest.emailId!)).toBe(2)
      expect(await stateOf(guest.id)).toBe(AccountState.ACTIVATED)
    })

    it('touches nothing for an id that does not exist', async () => {
      expect(await dbConfirmRegistrationContact(2_000_000_000)).toBe(0)
    })
  })
})

describe('the user_contacts queries registration uses', () => {
  let bibiId: number

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    bibiId = (await userFactoryDrizzle(bibiBloxberg)).id
  })

  const newContact = (email: string, emailVerificationCode: bigint) => ({
    email,
    userId: bibiId,
    type: UserContactType.USER_CONTACT_EMAIL,
    emailChecked: false,
    emailOptInTypeId: OptInType.EMAIL_OPT_IN_REGISTER,
    emailVerificationCode,
  })

  it('stores the contact, and finds it by either unique field', async () => {
    const result = await dbInsertUserContact(newContact('new@contact.test', 111n))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(await dbIsUserContactFieldExist('email', 'new@contact.test')).toBe(result.value)
      expect(await dbIsUserContactFieldExist('emailVerificationCode', 111n)).toBe(result.value)
    }
    expect(await dbIsUserContactFieldExist('email', 'nobody@contact.test')).toBe(0)
  })

  // RegisterUserRole draws a new code on a clash - the insert must answer, not throw.
  it('answers a taken address or a taken verification code with DBDuplicateEntryError', async () => {
    await dbInsertUserContact(newContact('taken@contact.test', 222n))
    expect(await dbInsertUserContact(newContact('taken@contact.test', 333n))).toEqual({
      success: false,
      error: expect.any(DBDuplicateEntryError),
    })
    expect(await dbInsertUserContact(newContact('other@contact.test', 222n))).toEqual({
      success: false,
      error: expect.any(DBDuplicateEntryError),
    })
  })

  // The registration asks inside its transaction: a contact written there and not yet committed
  // is seen through `tx`, and only through it.
  it('asks over the transaction it is given', async () => {
    await drizzleDb().transaction(async (tx) => {
      const result = await dbInsertUserContact(newContact('pending@contact.test', 555n), tx)
      if (!result.success) {
        throw result.error
      }
      expect(await dbIsUserContactFieldExist('email', 'pending@contact.test', tx)).toBe(
        result.value,
      )
      expect(await dbIsUserContactFieldExist('email', 'pending@contact.test')).toBe(0)
    })
  })

  it('removes a contact for good', async () => {
    const result = await dbInsertUserContact(newContact('removed@contact.test', 444n))
    if (!result.success) {
      throw result.error
    }
    expect(await dbRemoveUserContact(result.value)).toBe(1)
    expect(await dbIsUserContactFieldExist('email', 'removed@contact.test')).toBe(0)
  })
})

describe('the user_contacts queries setPassword uses', () => {
  const SET_PASSWORD_TYPES = [
    OptInType.EMAIL_OPT_IN_REGISTER,
    OptInType.EMAIL_OPT_IN_RESET_PASSWORD,
  ]
  let bob: DbUser

  const setCode = (email: string, code: bigint) =>
    drizzleDb()
      .update(userContactsTable)
      .set({ emailVerificationCode: code })
      .where(eq(userContactsTable.email, email))

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    bob = await userFactoryDrizzle(bobBaumeister)
    await setCode(bobBaumeister.email, 9101n)
    // A confirmed address that is not the one `users.email_id` points to: an address the
    // member gave up, whose code still stands.
    await insertContact({
      userId: bob.id,
      email: 'bob-former@baumeister.de',
      emailChecked: true,
      optInType: OptInType.EMAIL_OPT_IN_REGISTER,
      code: 9105n,
    })
    await insertContact({
      userId: bob.id,
      email: 'bob-next@baumeister.de',
      emailChecked: false,
      optInType: OptInType.EMAIL_OPT_IN_CHANGE,
      code: 9201n,
    })
    await insertContact({
      userId: bob.id,
      email: 'bob-gone@baumeister.de',
      emailChecked: true,
      optInType: OptInType.EMAIL_OPT_IN_REGISTER,
      code: 9301n,
      deletedAt: new Date(),
    })
    const raeuber = await userFactoryDrizzle(raeuberHotzenplotz)
    await setCode(raeuberHotzenplotz.email, 9401n)
    await drizzleDb()
      .update(usersTable)
      .set({ deletedAt: new Date() })
      .where(eq(usersTable.id, raeuber.id))
  })

  describe('dbFindUserContactByCodeAndTypes', () => {
    it('finds the address in force by its code, with its member', async () => {
      const row = await dbFindUserContactByCodeAndTypes(9101n, SET_PASSWORD_TYPES)
      expect(row?.id).toBe(bob.emailId)
      expect(row?.user?.id).toBe(bob.id)
    })

    // The trap the caller has to check for: the row is found, its member is not.
    it('finds a former address by its code too, but without its member', async () => {
      const row = await dbFindUserContactByCodeAndTypes(9105n, SET_PASSWORD_TYPES)
      expect(row?.userId).toBe(bob.id)
      expect(row?.user).toBeNull()
    })

    it('reaches a code only through the types it is asked for', async () => {
      expect(await dbFindUserContactByCodeAndTypes(9201n, SET_PASSWORD_TYPES)).toBeUndefined()
      expect(
        (await dbFindUserContactByCodeAndTypes(9201n, [OptInType.EMAIL_OPT_IN_CHANGE]))?.email,
      ).toBe('bob-next@baumeister.de')
    })

    // TypeORM left both out on its own, the contact and the member it joined.
    it('finds nothing behind a deleted address or a deleted member', async () => {
      expect(await dbFindUserContactByCodeAndTypes(9301n, SET_PASSWORD_TYPES)).toBeUndefined()
      expect(await dbFindUserContactByCodeAndTypes(9401n, SET_PASSWORD_TYPES)).toBeUndefined()
    })

    it('finds nothing for a code nobody has', async () => {
      expect(await dbFindUserContactByCodeAndTypes(9999n, SET_PASSWORD_TYPES)).toBeUndefined()
    })
  })

  describe('dbFindUserContactWithUserByEmail', () => {
    it('finds the address in force with its member, a former one without', async () => {
      const row = await dbFindUserContactWithUserByEmail(bobBaumeister.email)
      expect(row?.id).toBe(bob.emailId)
      expect(row?.user?.id).toBe(bob.id)
      expect((await dbFindUserContactWithUserByEmail('bob-former@baumeister.de'))?.user).toBeNull()
    })

    it('leaves out a deleted address and a deleted member, unless asked withDeleted', async () => {
      expect(await dbFindUserContactWithUserByEmail('bob-gone@baumeister.de')).toBeUndefined()
      expect(await dbFindUserContactWithUserByEmail(raeuberHotzenplotz.email)).toBeUndefined()

      const gone = await dbFindUserContactWithUserByEmail('bob-gone@baumeister.de', true)
      expect(gone?.deletedAt).not.toBeNull()
      const deletedMember = await dbFindUserContactWithUserByEmail(raeuberHotzenplotz.email, true)
      expect(deletedMember?.user?.deletedAt).not.toBeNull()
    })

    it('finds nothing for an address nobody has', async () => {
      expect(await dbFindUserContactWithUserByEmail('nobody@example.org', true)).toBeUndefined()
    })
  })

  describe('dbUserContactUpdateField', () => {
    it('writes the one named column of that contact and counts the row', async () => {
      const id = await insertContact({
        userId: bob.id,
        email: 'bob-unchecked@baumeister.de',
        emailChecked: false,
        optInType: OptInType.EMAIL_OPT_IN_REGISTER,
      })

      expect(await dbUserContactUpdateField(id, 'emailChecked', true)).toBe(1)

      const [stored] = await drizzleDb()
        .select()
        .from(userContactsTable)
        .where(eq(userContactsTable.id, id))
      expect(stored.emailChecked).toBe(true)
      expect(stored.email).toBe('bob-unchecked@baumeister.de')
    })

    it('counts nothing for a contact nobody has', async () => {
      expect(await dbUserContactUpdateField(999999, 'emailChecked', true)).toBe(0)
      expect(await dbUserContactUpdate(999999, { emailResendCount: 1 })).toBe(0)
    })
  })

  // forgotPassword: the new code, its type and the count of mails in one write.
  describe('dbUserContactUpdate', () => {
    it('writes the columns it is given and leaves the rest of the row alone', async () => {
      expect(
        await dbUserContactUpdate(bob.emailId!, {
          emailVerificationCode: 9102n,
          emailOptInTypeId: OptInType.EMAIL_OPT_IN_RESET_PASSWORD,
          emailResendCount: 3,
        }),
      ).toBe(1)

      const stored = await dbFindUserContact(bob.emailId!)
      expect(stored?.emailVerificationCode).toBe(9102n)
      expect(stored?.emailOptInTypeId).toBe(OptInType.EMAIL_OPT_IN_RESET_PASSWORD)
      expect(stored?.emailResendCount).toBe(3)
      expect(stored?.email).toBe(bobBaumeister.email)
    })
  })

  describe('dbFindUserContact', () => {
    it('finds a deleted contact only withDeleted', async () => {
      const [gone] = await drizzleDb()
        .select({ id: userContactsTable.id })
        .from(userContactsTable)
        .where(eq(userContactsTable.email, 'bob-gone@baumeister.de'))
      expect(await dbFindUserContact(gone.id)).toBeNull()
      expect((await dbFindUserContact(gone.id, true))?.email).toBe('bob-gone@baumeister.de')
    })
  })
})
