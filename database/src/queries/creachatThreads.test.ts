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
  dbSelectNewestLiveCreachatThread,
  dbUpdateCreachatThreadMessages,
} from './creachatThreads'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

const idsOf = async (userId: number): Promise<string[]> => {
  const rows = await db
    .select()
    .from(creachatThreadsTable)
    .where(eq(creachatThreadsTable.userId, userId))
  return rows.map((row) => row.id).sort()
}

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

  // The one that matters: the moderator works in the thread he last wrote to, not in the
  // one he opened last. Ordering these two apart is what stops an empty thread opened by
  // a second tab from shadowing a conversation that is still in use.
  it('should return the thread last USED, not the one last created', async () => {
    await db.insert(creachatThreadsTable).values([
      {
        id: 'thread-worked-in',
        userId: 2,
        messages: '[]',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
      {
        id: 'thread-opened-later',
        userId: 2,
        messages: '[]',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ])

    const result = await dbSelectNewestLiveCreachatThread(2, new Date('2026-01-01T00:00:00.000Z'))
    expect(result.success).toBe(true)
    expect(result.success && result.value.id).toBe('thread-worked-in')
  })

  it('should not return a thread that fell behind the cutoff', async () => {
    const result = await dbSelectNewestLiveCreachatThread(2, new Date('2026-07-01T00:00:00.000Z'))
    expect(result.success).toBe(false)
  })

  it('should report no live thread for a moderator without threads', async () => {
    const result = await dbSelectNewestLiveCreachatThread(999, new Date('2020-01-01T00:00:00.000Z'))
    expect(result.success).toBe(false)
  })

  // The user id is part of the condition, not decoration: a thread id must not be enough
  // to reach someone else's conversation.
  it('should find a thread only for its own moderator', async () => {
    const own = await dbSelectCreachatThreadByIdAndUserId('thread-worked-in', 2)
    expect(own.success).toBe(true)

    const foreign = await dbSelectCreachatThreadByIdAndUserId('thread-worked-in', 3)
    expect(foreign.success).toBe(false)
  })

  it('should replace the transcript and mark the thread as used', async () => {
    const before = new Date()
    before.setMilliseconds(0)
    const transcript = JSON.stringify([{ role: 'user', content: 'Hallo' }])

    const result = await dbUpdateCreachatThreadMessages('thread-worked-in', 2, transcript)
    expect(result.success).toBe(true)

    const rows = await db
      .select()
      .from(creachatThreadsTable)
      .where(eq(creachatThreadsTable.id, 'thread-worked-in'))
    expect(rows[0].messages).toBe(transcript)
    expect(rows[0].updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })

  // The write is scoped for the same reason the reads are, and it is the one where
  // getting it wrong overwrites another moderator's conversation.
  it('should refuse to write to a thread of another moderator', async () => {
    const stored = await db
      .select()
      .from(creachatThreadsTable)
      .where(eq(creachatThreadsTable.id, 'thread-worked-in'))

    const result = await dbUpdateCreachatThreadMessages('thread-worked-in', 3, '[]')
    expect(result.success).toBe(false)

    const after = await db
      .select()
      .from(creachatThreadsTable)
      .where(eq(creachatThreadsTable.id, 'thread-worked-in'))
    expect(after[0].messages).toBe(stored[0].messages)
  })

  it('should report a missing thread on update instead of failing silently', async () => {
    const result = await dbUpdateCreachatThreadMessages('does-not-exist', 2, '[]')
    expect(result.success).toBe(false)
  })

  it('should delete a thread only for its own moderator', async () => {
    const foreign = await dbDeleteCreachatThreadByIdAndUserId('thread-opened-later', 3)
    expect(foreign.success).toBe(false)
    expect(await idsOf(2)).toEqual(['thread-opened-later', 'thread-worked-in'])

    const own = await dbDeleteCreachatThreadByIdAndUserId('thread-opened-later', 2)
    expect(own.success).toBe(true)
    expect(await idsOf(2)).toEqual(['thread-worked-in'])
  })

  // Deliberately not scoped to one moderator: scoped, the retention rule would only ever
  // reach whoever happens to open the chat, and threads of a moderator who left would
  // stay forever.
  it('should sweep the idle threads of every moderator, not just one', async () => {
    await db.insert(creachatThreadsTable).values([
      {
        id: 'thread-idle-of-4',
        userId: 4,
        messages: '[]',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'thread-idle-of-5',
        userId: 5,
        messages: '[]',
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'thread-fresh-of-4',
        userId: 4,
        messages: '[]',
        updatedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ])

    const deleted = await dbDeleteCreachatThreadsUnusedSince(new Date('2026-03-01T00:00:00.000Z'))
    expect(deleted).toBe(2)
    expect(await idsOf(4)).toEqual(['thread-fresh-of-4'])
    expect(await idsOf(5)).toEqual([])
  })
})
