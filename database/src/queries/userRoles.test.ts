// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { isDuplicateEntry } from '../errorTypes'
import { userContactsTable, userRolesTable, usersTable } from '../schemas'
import { createCommunity } from '../seeds/community'
import { userFactoryDrizzle } from '../seeds/factory/user'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { bobBaumeister } from '../seeds/users/bob-baumeister'
import { garrickOllivander } from '../seeds/users/garrick-ollivander'
import { peterLustig } from '../seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '../seeds/users/raeuber-hotzenplotz'
import { stephenHawking } from '../seeds/users/stephen-hawking'
import { dbDeleteAllRowsExceptMigrations } from './informationSchemaTables'
import {
  dbInsertUserRoles,
  dbRemoveUserRoles,
  dbSelectRoleHoldersWithContact,
  dbUpdateUserRoleHandledCreationGroups,
  dbUpdateUserRoleSupportDuty,
  dbUpsertUserRole,
} from './userRoles'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// No users rows needed: user_roles carries no foreign key, and these tests are about the
// table's own rule -- one row per user_id.
const MEMBER = 9101
const OTHER = 9102
const BYSTANDER = 9103

const rolesOf = (userId: number) =>
  db.select().from(userRolesTable).where(eq(userRolesTable.userId, userId))

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(userRolesTable)
})
afterAll(async () => {
  await db.delete(userRolesTable)
  await appDB.destroy()
})

describe('userRoles query test', () => {
  it("writes a member's first role", async () => {
    await dbUpsertUserRole(MEMBER, 'MODERATOR')

    const rows = await rolesOf(MEMBER)
    expect(rows).toHaveLength(1)
    expect(rows[0].role).toBe('MODERATOR')
  })

  it('changes the one row rather than adding a second', async () => {
    const [before] = await rolesOf(MEMBER)

    await dbUpsertUserRole(MEMBER, 'ADMIN')

    const rows = await rolesOf(MEMBER)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(before.id)
    expect(rows[0].role).toBe('ADMIN')
    expect(rows[0].updatedAt).toBeInstanceOf(Date)
  })

  // What setUserRole did before it went through this query: saved the row with a new role
  // and nothing else. Removing the role is what resets a moderator's scope -- and their tick
  // "may handle support requests" (K6), which lives on the same row.
  it("leaves a moderator's group scope and tick alone when the role changes", async () => {
    await db
      .update(userRolesTable)
      .set({ visibleCreationGroups: '["garden"]', supportDuty: true })
      .where(eq(userRolesTable.userId, MEMBER))

    await dbUpsertUserRole(MEMBER, 'MODERATOR')

    const [row] = await rolesOf(MEMBER)
    expect(row.visibleCreationGroups).toBe('["garden"]')
    expect(row.supportDuty).toBe(true)
  })

  // ⛔ The race this query exists for: two admins granting a role to the same member at the
  // same moment. Before migration 0135 both inserts landed and the member had two rows.
  it('ends with exactly one row when two grants arrive at once', async () => {
    await Promise.all([dbUpsertUserRole(OTHER, 'MODERATOR'), dbUpsertUserRole(OTHER, 'ADMIN')])

    const rows = await rolesOf(OTHER)
    expect(rows).toHaveLength(1)
    expect(['MODERATOR', 'ADMIN']).toContain(rows[0].role)
  })

  // The rule itself, not only the query that respects it: a plain insert of a second role
  // is refused by the database (unique key on user_id, migration 0135).
  it('refuses a second row for the same member at the database', async () => {
    let error: unknown
    try {
      await db.insert(userRolesTable).values({ userId: MEMBER, role: 'MODERATOR_AI' })
    } catch (e) {
      error = e
    }
    expect(isDuplicateEntry(error)).toBe(true)
    expect(await rolesOf(MEMBER)).toHaveLength(1)
  })

  it('removes the roles of exactly the given members', async () => {
    await dbUpsertUserRole(BYSTANDER, 'MODERATOR')

    await dbRemoveUserRoles([MEMBER, OTHER])

    expect(await rolesOf(MEMBER)).toHaveLength(0)
    expect(await rolesOf(OTHER)).toHaveLength(0)
    expect(await rolesOf(BYSTANDER)).toHaveLength(1)
  })

  it('does nothing for an empty list', async () => {
    await dbRemoveUserRoles([])

    expect(await rolesOf(BYSTANDER)).toHaveLength(1)
  })

  // The tick went with the row MEMBER had, three tests up: whoever is given a role anew begins
  // without it.
  it('writes a first role without the tick', async () => {
    await dbUpsertUserRole(MEMBER, 'MODERATOR')

    const [row] = await rolesOf(MEMBER)
    expect(row.supportDuty).toBe(false)
  })
})

// The tick "may handle support requests" (Support-Anfragen K6): set and taken away on a row of one
// of the two moderator kinds only, the role checked by the very statement that writes.
describe('dbUpdateUserRoleSupportDuty', () => {
  const MODERATOR = 9201
  const MODERATOR_AI = 9202
  const ADMIN = 9203
  const USER = 9204
  const NOBODY = 9205
  const tickOf = async (userId: number) => (await rolesOf(userId))[0]?.supportDuty

  beforeAll(async () => {
    await db.delete(userRolesTable)
    await db.insert(userRolesTable).values([
      { userId: MODERATOR, role: 'MODERATOR' },
      { userId: MODERATOR_AI, role: 'MODERATOR_AI' },
      { userId: ADMIN, role: 'ADMIN' },
      // rows with USER existed (migration 0136)
      { userId: USER, role: 'USER' },
    ])
  })
  afterAll(async () => {
    await db.delete(userRolesTable)
  })

  it('sets the tick of either moderator kind, and takes it away again', async () => {
    for (const userId of [MODERATOR, MODERATOR_AI]) {
      expect(await dbUpdateUserRoleSupportDuty(userId, true)).toEqual({ success: true })
      const [row] = await rolesOf(userId)
      expect(row.supportDuty).toBe(true)
      expect(row.updatedAt).toBeInstanceOf(Date)
      expect(await dbUpdateUserRoleSupportDuty(userId, false)).toEqual({ success: true })
      expect(await tickOf(userId)).toBe(false)
    }
  })

  it('finds a tick set twice, and writes it as it was', async () => {
    expect(await dbUpdateUserRoleSupportDuty(MODERATOR, true)).toEqual({ success: true })
    expect(await dbUpdateUserRoleSupportDuty(MODERATOR, true)).toEqual({ success: true })
    expect(await tickOf(MODERATOR)).toBe(true)
  })

  it.each([
    ['an administrator', ADMIN],
    ['a row with USER', USER],
    ['a member without a role', NOBODY],
  ])('writes nothing for %s, and says so', async (_name, userId) => {
    const answer = await dbUpdateUserRoleSupportDuty(userId, true)
    expect(answer.success).toBe(false)
    expect(await tickOf(userId)).toBe(userId === NOBODY ? undefined : false)
  })

  // the role is the condition of the write: one turned into ADMIN meanwhile keeps its tick as it was
  it('writes nothing where the moderator became an administrator', async () => {
    await dbUpsertUserRole(MODERATOR_AI, 'ADMIN')
    expect((await dbUpdateUserRoleSupportDuty(MODERATOR_AI, true)).success).toBe(false)
    expect(await tickOf(MODERATOR_AI)).toBe(false)
  })
})

// "Meine Gruppen" (MG1): written on a row with a role of the moderation only, the role checked by
// the very statement that writes; everything else on the row stays as it is.
describe('dbUpdateUserRoleHandledCreationGroups', () => {
  const ADMIN = 9301
  const MODERATOR = 9302
  const MODERATOR_AI = 9303
  const USER = 9304
  const NOBODY = 9305
  const CHOICE = '{"groupIds":[3,7],"untagged":true}'
  const choiceOf = async (userId: number) => (await rolesOf(userId))[0]?.handledCreationGroups

  beforeAll(async () => {
    await db.delete(userRolesTable)
    await db.insert(userRolesTable).values([
      { userId: ADMIN, role: 'ADMIN' },
      {
        userId: MODERATOR,
        role: 'MODERATOR',
        visibleCreationGroups: '["garden","*untagged"]',
        supportDuty: true,
      },
      { userId: MODERATOR_AI, role: 'MODERATOR_AI' },
      // rows with USER existed (migration 0136)
      { userId: USER, role: 'USER' },
    ])
  })
  afterAll(async () => {
    await db.delete(userRolesTable)
  })

  it('sets the choice of every role of the moderation, and clears it with null', async () => {
    for (const userId of [ADMIN, MODERATOR, MODERATOR_AI]) {
      expect(await dbUpdateUserRoleHandledCreationGroups(userId, CHOICE)).toEqual({
        success: true,
      })
      const [row] = await rolesOf(userId)
      expect(row.handledCreationGroups).toBe(CHOICE)
      expect(row.updatedAt).toBeInstanceOf(Date)
      expect(await dbUpdateUserRoleHandledCreationGroups(userId, null)).toEqual({ success: true })
      expect(await choiceOf(userId)).toBeNull()
    }
  })

  it('finds a choice saved twice', async () => {
    expect(await dbUpdateUserRoleHandledCreationGroups(ADMIN, CHOICE)).toEqual({ success: true })
    expect(await dbUpdateUserRoleHandledCreationGroups(ADMIN, CHOICE)).toEqual({ success: true })
    expect(await choiceOf(ADMIN)).toBe(CHOICE)
  })

  it('leaves the role, the scope and the tick of the row as they are', async () => {
    await dbUpdateUserRoleHandledCreationGroups(MODERATOR, CHOICE)

    const [row] = await rolesOf(MODERATOR)
    expect(row.role).toBe('MODERATOR')
    expect(row.visibleCreationGroups).toBe('["garden","*untagged"]')
    expect(row.supportDuty).toBe(true)
    expect(row.handledCreationGroups).toBe(CHOICE)
  })

  it.each([
    ['a row with USER', USER],
    ['a member without a role', NOBODY],
  ])('writes nothing for %s, and says so', async (_name, userId) => {
    const answer = await dbUpdateUserRoleHandledCreationGroups(userId, CHOICE)
    expect(answer.success).toBe(false)
    expect(await choiceOf(userId)).toBe(userId === NOBODY ? undefined : null)
  })

  // Whether a choice counts under the role of the moment decides the backend on reading
  // (handledCreationGroupsOf): a role change leaves it standing, as it leaves scope and tick.
  it('keeps the choice through a change of the role', async () => {
    await dbUpdateUserRoleHandledCreationGroups(MODERATOR_AI, CHOICE)

    await dbUpsertUserRole(MODERATOR_AI, 'ADMIN')
    expect(await choiceOf(MODERATOR_AI)).toBe(CHOICE)
    await dbUpsertUserRole(MODERATOR_AI, 'MODERATOR')
    expect(await choiceOf(MODERATOR_AI)).toBe(CHOICE)
  })
})

describe('dbInsertUserRoles', () => {
  const FIRST = 20000
  const rows = Array.from({ length: 3 }, (_, i) => ({ userId: FIRST + i, role: 'MODERATOR' }))
  const countFrom = async (userId: number) =>
    (await db.select().from(userRolesTable)).filter((row) => row.userId >= userId).length

  afterEach(async () => {
    await db.delete(userRolesTable)
  })

  it('writes every row it is given', async () => {
    await dbInsertUserRoles(rows)

    expect(await countFrom(FIRST)).toBe(3)
  })

  it('writes inside the transaction it is given', async () => {
    await expect(
      drizzleDb().transaction(async (tx) => {
        await dbInsertUserRoles(rows, tx)
        throw new Error('roll back')
      }),
    ).rejects.toThrow('roll back')

    expect(await countFrom(FIRST)).toBe(0)
  })

  it('writes nothing for an empty list', async () => {
    await dbInsertUserRoles([])

    expect(await countFrom(FIRST)).toBe(0)
  })
})

// The members a mail to the moderation may go to (Support-Anfragen K5): a role a row may hold,
// an account of this community that is not deleted, a confirmed address in force.
describe('dbSelectRoleHoldersWithContact', () => {
  const withRole = (
    userId: number,
    role: string,
    visibleCreationGroups: string | null = null,
    supportDuty = false,
  ) => db.insert(userRolesTable).values({ userId, role, visibleCreationGroups, supportDuty })
  const heldBy = async () => (await dbSelectRoleHoldersWithContact()).map(({ userId }) => userId)

  let peter: number
  let bob: number
  let raeuber: number

  beforeAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
    await createCommunity(false)
    // an administrator, written with the role by the factory
    peter = (await userFactoryDrizzle(peterLustig)).id
    bob = (await userFactoryDrizzle(bobBaumeister)).id
    raeuber = (await userFactoryDrizzle(raeuberHotzenplotz)).id
    // bob with the tick (K6), räuber without: the column is read, not assumed
    await withRole(bob, 'MODERATOR', '["garden","*untagged"]', true)
    await withRole(raeuber, 'MODERATOR_AI')
  })
  afterAll(async () => {
    await dbDeleteAllRowsExceptMigrations()
  })

  it('answers each of them with role, scope, tick, name, language and address, by number', async () => {
    expect(await dbSelectRoleHoldersWithContact()).toEqual([
      {
        userId: peter,
        role: 'ADMIN',
        visibleCreationGroups: null,
        supportDuty: false,
        firstName: 'Peter',
        lastName: 'Lustig',
        language: 'de',
        email: 'peter@lustig.de',
      },
      {
        userId: bob,
        role: 'MODERATOR',
        visibleCreationGroups: '["garden","*untagged"]',
        supportDuty: true,
        firstName: 'Bob',
        lastName: 'der Baumeister',
        language: 'de',
        email: 'bob@baumeister.de',
      },
      {
        userId: raeuber,
        role: 'MODERATOR_AI',
        visibleCreationGroups: null,
        supportDuty: false,
        firstName: 'Räuber',
        lastName: 'Hotzenplotz',
        language: 'de',
        email: 'raeuber@hotzenplotz.de',
      },
    ])
  })

  it('leaves out a member without a role, and a row with a role no row may hold', async () => {
    const bibi = (await userFactoryDrizzle(bibiBloxberg)).id
    const garrick = (await userFactoryDrizzle({ ...garrickOllivander, emailChecked: true })).id
    await withRole(garrick, 'USER')
    const dlt = (
      await userFactoryDrizzle({ ...garrickOllivander, alias: 'DltRole', email: 'dlt@role.de' })
    ).id
    await db
      .update(userContactsTable)
      .set({ emailChecked: true })
      .where(eq(userContactsTable.userId, dlt))
    await withRole(dlt, 'DLT_CONNECTOR_ROLE')

    const held = await heldBy()
    expect(held).not.toContain(bibi)
    expect(held).not.toContain(garrick)
    expect(held).not.toContain(dlt)
    expect(held).toEqual([peter, bob, raeuber])
  })

  it('leaves out an address not confirmed', async () => {
    const unconfirmed = (
      await userFactoryDrizzle({ ...garrickOllivander, alias: 'NotYet', email: 'not@yet.de' })
    ).id
    await withRole(unconfirmed, 'MODERATOR')

    expect(await heldBy()).not.toContain(unconfirmed)
  })

  it('leaves out a deleted account and a member of another community', async () => {
    const deleted = (await userFactoryDrizzle(stephenHawking)).id
    await withRole(deleted, 'ADMIN')
    const foreign = (
      await userFactoryDrizzle({ ...bobBaumeister, alias: 'ForeignBob', email: 'bob@far.away' })
    ).id
    await db.update(usersTable).set({ foreign: true }).where(eq(usersTable.id, foreign))
    await withRole(foreign, 'MODERATOR')

    const held = await heldBy()
    expect(held).not.toContain(deleted)
    expect(held).not.toContain(foreign)
  })

  it('leaves out a member whose address in force is deleted, or who has none', async () => {
    const goneAddress = (
      await userFactoryDrizzle({ ...bobBaumeister, alias: 'GoneMail', email: 'gone@mail.de' })
    ).id
    await db
      .update(userContactsTable)
      .set({ deletedAt: new Date() })
      .where(eq(userContactsTable.userId, goneAddress))
    await withRole(goneAddress, 'MODERATOR')
    const noAddress = (
      await userFactoryDrizzle({ ...bobBaumeister, alias: 'NoMail', email: 'no@mail.de' })
    ).id
    await db.update(usersTable).set({ emailId: null }).where(eq(usersTable.id, noAddress))
    await withRole(noAddress, 'MODERATOR')

    expect(await heldBy()).toEqual([peter, bob, raeuber])
  })
})
