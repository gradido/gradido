// AI-GENERATED — not an architecture reference
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { ContributionStatus } from '../enum/ContributionStatus'
import { ContributionType } from '../enum/ContributionType'
import { contributionMessagesTable, contributionsTable } from '../schemas'
import { dbSelectFirstCreationMessage } from './contributionMessages'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

// Rows are written straight into the two tables: what is under test is the join and the
// order, and the seeds' factories would drag users and transactions along for nothing.
const ALICE = 301
const BOB = 302
const SIGNER = 7

const insertContribution = async (userId: number, firstCreation: boolean): Promise<number> => {
  const result = await db.insert(contributionsTable).values({
    userId,
    memo: 'Ich habe ...',
    type: ContributionType.USER,
    status: ContributionStatus.PENDING,
    createdAt: new Date(),
    contributionDate: new Date(),
    firstCreation,
  })
  return result[0].insertId
}

const insertMessage = async (
  contributionId: number,
  userId: number,
  message: string,
  extra: { type?: string; isModerator?: boolean; deletedAt?: Date } = {},
): Promise<void> => {
  await db.insert(contributionMessagesTable).values({
    contributionId,
    userId,
    message,
    type: extra.type ?? 'DIALOG',
    isModerator: extra.isModerator ?? true,
    deletedAt: extra.deletedAt ?? null,
  })
}

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(contributionMessagesTable)
  await db.delete(contributionsTable)
})
afterAll(async () => {
  await db.delete(contributionMessagesTable)
  await db.delete(contributionsTable)
  await appDB.destroy()
})

describe('contributionMessages query test', () => {
  it('answers nothing for a member whose bundle carries no note', async () => {
    const bare = await insertContribution(ALICE, true)
    await insertMessage(bare, ALICE, 'Meine eigene Frage dazu', { isModerator: false })
    await insertMessage(bare, SIGNER, 'Interne Notiz', { type: 'MODERATOR' })
    await insertMessage(bare, SIGNER, 'Ein zurückgenommener Dank', { deletedAt: new Date() })
    expect(await dbSelectFirstCreationMessage(ALICE)).toBeNull()
  })

  it('reads the first note the signer put on the bundle, and only off the marked rows', async () => {
    const earlier = await insertContribution(BOB, false)
    await insertMessage(earlier, SIGNER, 'Zu einer früheren Schöpfung')
    const first = await insertContribution(BOB, true)
    const second = await insertContribution(BOB, true)
    await insertMessage(first, SIGNER, 'Liebe Bibi, willkommen!')
    await insertMessage(second, SIGNER, 'Deine Einträge schaut sich noch ein Mensch an.')
    expect(await dbSelectFirstCreationMessage(BOB)).toBe('Liebe Bibi, willkommen!')
    expect(await dbSelectFirstCreationMessage(999)).toBeNull()
  })
})
