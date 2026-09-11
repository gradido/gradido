// AI-GENERATED — not an architecture reference
import { inArray } from 'drizzle-orm'
import { OptInType, UserContactType } from 'shared'
import { Community as DbCommunity, User as DbUser, UserContact as DbUserContact } from '..'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { userContactsTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { userFactory } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import {
  dbFindConfirmedUserContactEmails,
  dbFindUserIdsByEmailLike,
  dbPurgeExpiredEmailChanges,
  dbReleaseUnconfirmedEmailChangeFor,
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
    await DbUser.clear()
    await DbUserContact.clear()
    await DbCommunity.clear()

    await createCommunity(false)
    bibi = await userFactory(bibiBloxberg)
    peter = await userFactory(peterLustig)

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

  describe('dbFindUserIdsByEmailLike', () => {
    it('names a member once for any of their living rows, and not for a deleted one', async () => {
      expect(await dbFindUserIdsByEmailLike('bibi-typed')).toEqual([bibi.id])
      expect(await dbFindUserIdsByEmailLike('bloxberg')).toEqual([bibi.id])
      expect(await dbFindUserIdsByEmailLike('bibi-gone')).toEqual([])
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
})
