import { beforeEach } from 'node:test'
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase } from '../AppDatabase'
import { openaiThreadsTable } from '../schemas'
import {
  dbDeleteOpenaiThread,
  dbFindNewestCreatedOpenaiThreadByUserId,
  dbInsertOpenaiThread,
  dbUpdateOpenaiThread,
} from './openaiThreads'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

beforeAll(async () => {
  await appDB.init()
  db = appDB.getDrizzleDataSource()
  await db.delete(openaiThreadsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('openaiThreads query test', () => {  
  it('should insert a new openai thread', async () => {
    await Promise.resolve([dbInsertOpenaiThread('7', 1), dbInsertOpenaiThread('72', 6)])
    const result = await db.select().from(openaiThreadsTable)
    expect(result).toHaveLength(2)
    expect(result).toMatchObject([
      { id: '7', userId: 1 },
      { id: '72', userId: 6 },
    ])
  })

  it('should find the newest created openai thread by user id', async () => {
    await db.insert(openaiThreadsTable).values([
      { id: '75', userId: 2, createdAt: new Date('2025-01-01T00:00:00.000Z') },
      { id: '172', userId: 2, createdAt: new Date('2025-01-02T00:00:00.000Z') },
    ])
    const result = await dbFindNewestCreatedOpenaiThreadByUserId(2)
    expect(result).toBeDefined()
    expect(result).toMatchObject({
      id: '172',
      userId: 2,
      createdAt: new Date('2025-01-02T00:00:00.000Z'),
    })
  })

  it('should update an existing openai thread', async () => {
    const now = new Date()
    now.setMilliseconds(0)
    await dbUpdateOpenaiThread('172')
    const result = await db
      .select()
      .from(openaiThreadsTable)
      .where(eq(openaiThreadsTable.id, '172'))
    expect(result).toHaveLength(1)
    expect(result[0].updatedAt.getTime()).toBeGreaterThanOrEqual(now.getTime())
    expect(result).toMatchObject([{ id: '172', userId: 2, updatedAt: expect.any(Date) }])
  })

  it('should delete an existing openai thread', async () => {
    await dbDeleteOpenaiThread('172')
    const result = await db
      .select()
      .from(openaiThreadsTable)
      .where(eq(openaiThreadsTable.id, '172'))
    expect(result).toHaveLength(0)
  })
})
