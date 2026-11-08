// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { ContributionStatus } from '../enum/ContributionStatus'
import { ContributionType } from '../enum/ContributionType'
import { contributionsTable } from '../schemas'
import {
  dbCountOpenContributionsByUserId,
  dbCountUserTypedContributionsByUserId,
  dbSelectContributionUserId,
  dbSelectFirstCreationEntriesByUserId,
  dbUnmarkFirstCreationContributions,
} from './contributions'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Rows are written straight into `contributions`: what is under test is how the two
// queries read the table, and the seeds' creation factory would drag users and
// transactions along for nothing.
const ALICE = 201
const BOB = 202
let ids: number[] = []

const insert = async (
  userId: number,
  memo: string,
  type: ContributionType,
  extra: {
    confirmedAt?: Date
    deletedAt?: Date
    status?: ContributionStatus
    firstCreation?: boolean
  } = {},
): Promise<number> => {
  const result = await db.insert(contributionsTable).values({
    userId,
    memo,
    type,
    status: extra.status ?? ContributionStatus.PENDING,
    createdAt: new Date(),
    contributionDate: new Date(),
    confirmedAt: extra.confirmedAt ?? null,
    deletedAt: extra.deletedAt ?? null,
    firstCreation: extra.firstCreation ?? false,
  })
  return result[0].insertId
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(contributionsTable)
  // Alice's first creation: three entries, filed in this order; the first one booked, the
  // last one removed by the moderation.
  ids = [
    await insert(ALICE, 'Ich habe meine Kinder versorgt, indem ich ...', ContributionType.USER, {
      confirmedAt: new Date(),
      status: ContributionStatus.CONFIRMED,
      firstCreation: true,
    }),
    await insert(ALICE, 'Ich habe einem alten Menschen geholfen ...', ContributionType.USER, {
      firstCreation: true,
    }),
    await insert(ALICE, 'Ich habe im Verein geholfen ...', ContributionType.USER, {
      deletedAt: new Date(),
      status: ContributionStatus.DELETED,
      firstCreation: true,
    }),
  ]
  // An admin-filed one for Alice and a USER one for Bob: neither may count for Alice, and
  // neither belongs to her first creation.
  await insert(ALICE, 'Startguthaben', ContributionType.ADMIN)
  await insert(BOB, 'Ich habe etwas getan', ContributionType.USER, { firstCreation: true })
  // Two more shapes of "open" for Bob: one in progress, one denied (settled, not open).
  await insert(BOB, 'Ich habe noch etwas getan', ContributionType.ADMIN, {
    status: ContributionStatus.IN_PROGRESS,
  })
  // ADMIN-typed, so the USER-typed count above keeps its one row for Bob.
  await insert(BOB, 'Das wurde abgelehnt', ContributionType.ADMIN, {
    status: ContributionStatus.DENIED,
  })
})
afterAll(async () => {
  await db.delete(contributionsTable)
  await appDB.destroy()
})

describe('contributions query test', () => {
  it('counts the contributions a member filed themselves, deleted ones included', async () => {
    // Three USER rows, one of them deleted; the ADMIN row and Bob's row stay out.
    expect(await dbCountUserTypedContributionsByUserId(ALICE)).toBe(3)
    expect(await dbCountUserTypedContributionsByUserId(BOB)).toBe(1)
    expect(await dbCountUserTypedContributionsByUserId(999)).toBe(0)
  })

  it('counts the open contributions of a member, whoever filed them, deleted ones excluded', async () => {
    // Alice: one confirmed (settled), one PENDING, one deleted, one ADMIN PENDING -> 2.
    expect(await dbCountOpenContributionsByUserId(ALICE)).toBe(2)
    // Bob: one PENDING, one IN_PROGRESS, one DENIED -> 2.
    expect(await dbCountOpenContributionsByUserId(BOB)).toBe(2)
    expect(await dbCountOpenContributionsByUserId(999)).toBe(0)
  })

  it('returns the entries of a first creation in the order they were filed, with tick and deletion visible', async () => {
    const [first, second, third] = ids
    const entries = await dbSelectFirstCreationEntriesByUserId(ALICE)
    expect(entries.map((entry) => entry.id)).toEqual([first, second, third])
    expect(entries[0]).toMatchObject({
      memo: 'Ich habe meine Kinder versorgt, indem ich ...',
      status: ContributionStatus.CONFIRMED,
    })
    expect(entries[0].confirmedAt).toBeInstanceOf(Date)
    expect(entries[1].confirmedAt).toBeNull()
    expect(entries[2].deletedAt).toBeInstanceOf(Date)
  })

  it('answers an empty list for a member without a first creation', async () => {
    expect(await dbSelectFirstCreationEntriesByUserId(999)).toEqual([])
  })

  it('takes the mark off one member and leaves the other one marked', async () => {
    await dbUnmarkFirstCreationContributions(ALICE)
    expect(await dbSelectFirstCreationEntriesByUserId(ALICE)).toEqual([])
    expect(await dbSelectFirstCreationEntriesByUserId(BOB)).toHaveLength(1)
    // The rows are still there, unmarked: nothing but the window forgot them.
    expect(await dbCountUserTypedContributionsByUserId(ALICE)).toBe(3)
  })

  it('names the owner of a contribution, and nobody for an id that does not exist', async () => {
    expect(await dbSelectContributionUserId(ids[0])).toBe(ALICE)
    expect(await dbSelectContributionUserId(424242)).toBeNull()
  })

  // ⚠️ A deleted contribution still has its owner. The thread of one a member removed was
  // readable to them before the guard, and it stays that way -- what the guard decides is
  // whose it is, not whether it still stands.
  it('names the owner of a deleted contribution too', async () => {
    expect(await dbSelectContributionUserId(ids[2])).toBe(ALICE)
  })
})
