// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { creachatThreadsTable } from '../schemas'
import {
  dbDeleteCreachatThreadByIdAndUserId,
  dbDeleteCreachatThreadsUnusedSince,
  dbInsertCreachatThread,
  dbSelectCreachatThreadByIdAndUserId,
  dbSelectCreachatThreadsByUserId,
  dbUpdateCreachatThreadMessages,
} from './creachatThreads'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.delete(creachatThreadsTable)
})
afterAll(async () => {
  await appDB.destroy()
})

describe('creachatThreads query test', () => {
  it('should insert a new creachat thread', async () => {
    const result = await dbInsertCreachatThread({ id: 'thread-a', userId: 1, messages: '[]' })
    expect(result.success).toBe(true)
    const rows = await db.select().from(creachatThreadsTable)
    expect(rows).toHaveLength(1)
    expect(rows).toMatchObject([{ id: 'thread-a', userId: 1, messages: '[]' }])
  })

  it('should return the threads of one moderator, newest first', async () => {
    await db.insert(creachatThreadsTable).values([
      {
        id: 'thread-b',
        userId: 2,
        messages: '[]',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'thread-c',
        userId: 2,
        messages: '[]',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ])
    const result = await dbSelectCreachatThreadsByUserId(2)
    expect(result.map((thread) => thread.id)).toEqual(['thread-c', 'thread-b'])
  })

  it('should answer with an empty list for a moderator without threads', async () => {
    expect(await dbSelectCreachatThreadsByUserId(999)).toHaveLength(0)
  })

  // The user id is part of the condition, not decoration: a thread id must not be enough
  // to reach someone else's conversation.
  it('should find a thread only for its own moderator', async () => {
    const own = await dbSelectCreachatThreadByIdAndUserId('thread-b', 2)
    expect(own.success).toBe(true)

    const foreign = await dbSelectCreachatThreadByIdAndUserId('thread-b', 3)
    expect(foreign.success).toBe(false)
  })

  it('should replace the transcript and mark the thread as used', async () => {
    const before = new Date()
    before.setMilliseconds(0)
    const transcript = JSON.stringify([{ role: 'user', content: 'Hallo' }])

    const result = await dbUpdateCreachatThreadMessages('thread-b', transcript)
    expect(result.success).toBe(true)

    const rows = await db
      .select()
      .from(creachatThreadsTable)
      .where(eq(creachatThreadsTable.id, 'thread-b'))
    expect(rows[0].messages).toBe(transcript)
    expect(rows[0].updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })

  it('should report a missing thread on update instead of failing silently', async () => {
    const result = await dbUpdateCreachatThreadMessages('does-not-exist', '[]')
    expect(result.success).toBe(false)
  })

  it('should delete a thread only for its own moderator', async () => {
    const foreign = await dbDeleteCreachatThreadByIdAndUserId('thread-c', 3)
    expect(foreign.success).toBe(false)
    expect(await dbSelectCreachatThreadsByUserId(2)).toHaveLength(2)

    const own = await dbDeleteCreachatThreadByIdAndUserId('thread-c', 2)
    expect(own.success).toBe(true)
    expect(await dbSelectCreachatThreadsByUserId(2)).toHaveLength(1)
  })

  it('should sweep only the threads unused since the given moment', async () => {
    await db.insert(creachatThreadsTable).values([
      {
        id: 'thread-old',
        userId: 4,
        messages: '[]',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'thread-fresh',
        userId: 4,
        messages: '[]',
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ])

    const deleted = await dbDeleteCreachatThreadsUnusedSince(
      4,
      new Date('2026-03-01T00:00:00.000Z'),
    )
    expect(deleted).toBe(1)

    const remaining = await dbSelectCreachatThreadsByUserId(4)
    expect(remaining.map((thread) => thread.id)).toEqual(['thread-fresh'])
  })

  it('should leave another moderator untouched when sweeping', async () => {
    const deleted = await dbDeleteCreachatThreadsUnusedSince(
      4,
      new Date('2027-01-01T00:00:00.000Z'),
    )
    expect(deleted).toBe(1)
    expect(await dbSelectCreachatThreadsByUserId(1)).toHaveLength(1)
  })
})
