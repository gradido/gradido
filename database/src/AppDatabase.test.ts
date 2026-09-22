// AI-GENERATED — not an architecture reference
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { AppDatabase } from './AppDatabase'

const db = AppDatabase.getInstance()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// pub/sub runs over Redis, so a message arrives asynchronously
const nextMessage = (channel: string): Promise<string> =>
  new Promise((resolve) => db.subscribe(channel, resolve))

describe('AppDatabase pub/sub', () => {
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.destroy()
  })

  it('delivers a published message to the subscriber of the channel', async () => {
    const received = nextMessage('app_database_test_channel')
    // give the SUBSCRIBE command time to reach Redis before publishing
    await sleep(100)
    db.publish('app_database_test_channel', 'hello')
    expect(await received).toBe('hello')
  })

  it('delivers to every handler of a channel, and only for that channel', async () => {
    const first: string[] = []
    const second: string[] = []
    const other: string[] = []
    db.subscribe('app_database_test_shared', (message) => first.push(message))
    db.subscribe('app_database_test_shared', (message) => second.push(message))
    db.subscribe('app_database_test_other', (message) => other.push(message))
    await sleep(100)

    db.publish('app_database_test_shared', 'shared')
    await sleep(100)

    expect(first).toEqual(['shared'])
    expect(second).toEqual(['shared'])
    expect(other).toEqual([])
  })

  it('delivers only once to a handler subscribed twice', async () => {
    const messages: string[] = []
    const handler = (message: string) => messages.push(message)
    db.subscribe('app_database_test_twice', handler)
    db.subscribe('app_database_test_twice', handler)
    await sleep(100)

    db.publish('app_database_test_twice', 'once')
    await sleep(100)

    expect(messages).toEqual(['once'])
  })

  it('forgets all subscriptions on destroy', async () => {
    const before: string[] = []
    const after: string[] = []
    db.subscribe('app_database_test_reinit', (message) => before.push(message))
    await db.destroy()
    await db.init()
    db.subscribe('app_database_test_reinit', (message) => after.push(message))
    await sleep(100)

    db.publish('app_database_test_reinit', 'after reinit')
    await sleep(100)

    expect(before).toEqual([])
    expect(after).toEqual(['after reinit'])
  })

  it('refuses to subscribe before init', async () => {
    await db.destroy()
    expect(() => db.subscribe('app_database_test_uninitialized', () => undefined)).toThrow(
      'Redis subscriber not initialized',
    )
    await db.init()
  })
})
