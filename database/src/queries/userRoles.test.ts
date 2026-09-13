// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { isDuplicateEntry } from '../errorTypes'
import { userRolesTable } from '../schemas'
import { dbRemoveUserRoles, dbUpsertUserRole } from './userRoles'

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
  // and nothing else. Removing the role is what resets a moderator's scope.
  it("leaves a moderator's group scope alone when the role changes", async () => {
    await db
      .update(userRolesTable)
      .set({ visibleCreationGroups: '["garden"]' })
      .where(eq(userRolesTable.userId, MEMBER))

    await dbUpsertUserRole(MEMBER, 'MODERATOR')

    const [row] = await rolesOf(MEMBER)
    expect(row.visibleCreationGroups).toBe('["garden"]')
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
})
