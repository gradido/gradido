// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { ContributionStatus } from '../enum/ContributionStatus'
import { ContributionType } from '../enum/ContributionType'
import { contributionsTable } from '../schemas'
import {
  dbCountUserTypedContributionsByUserId,
  dbSelectFirstCreationEntriesByIds,
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
  extra: { confirmedAt?: Date; deletedAt?: Date; status?: ContributionStatus } = {},
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
  })
  return result[0].insertId
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(contributionsTable)
  ids = [
    await insert(ALICE, 'Ich habe meine Kinder versorgt, indem ich ...', ContributionType.USER, {
      confirmedAt: new Date(),
      status: ContributionStatus.CONFIRMED,
    }),
    await insert(ALICE, 'Ich habe einem alten Menschen geholfen ...', ContributionType.USER),
    await insert(ALICE, 'Ich habe im Verein geholfen ...', ContributionType.USER, {
      deletedAt: new Date(),
      status: ContributionStatus.DELETED,
    }),
  ]
  // An admin-filed one for Alice and a USER one for Bob: neither may count for Alice.
  await insert(ALICE, 'Startguthaben', ContributionType.ADMIN)
  await insert(BOB, 'Ich habe etwas getan', ContributionType.USER)
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

  it('returns the entries in the order of the ids, with tick and deletion visible', async () => {
    const [first, second, third] = ids
    const entries = await dbSelectFirstCreationEntriesByIds([third, first, second])
    expect(entries.map((entry) => entry.id)).toEqual([third, first, second])
    expect(entries[1]).toMatchObject({
      memo: 'Ich habe meine Kinder versorgt, indem ich ...',
      status: ContributionStatus.CONFIRMED,
    })
    expect(entries[1].confirmedAt).toBeInstanceOf(Date)
    expect(entries[2].confirmedAt).toBeNull()
    expect(entries[0].deletedAt).toBeInstanceOf(Date)
  })

  it('leaves out ids that do not exist and answers an empty list without a query', async () => {
    expect(await dbSelectFirstCreationEntriesByIds([ids[0], 424242])).toHaveLength(1)
    expect(await dbSelectFirstCreationEntriesByIds([])).toEqual([])
  })
})
