// AI-GENERATED — not an architecture reference
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { AppDatabase } from './AppDatabase'

const db = AppDatabase.getInstance()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// A message from another process: published on Redis directly, so it carries no sender of
// this process and is not delivered locally
const publishFromElsewhere = (channel: string, message: string) =>
  db.getRedisClient().publish(channel, message)

describe('AppDatabase pub/sub', () => {
  beforeAll(async () => {
    await db.init()
  })
  afterAll(async () => {
    await db.destroy()
  })

  it('delivers a message of another process once Redis has confirmed the subscription', async () => {
    const received: string[] = []
    await db.subscribe('app_database_test_channel', (message) => received.push(message))
    await publishFromElsewhere('app_database_test_channel', 'hello')
    await sleep(100)
    expect(received).toEqual(['hello'])
  })

  it('delivers its own message at once and only once, the copy from Redis is dropped', async () => {
    const received: string[] = []
    await db.subscribe('app_database_test_own', (message) => received.push(message))
    db.publish('app_database_test_own', 'own')
    expect(received).toEqual(['own'])
    await sleep(100)
    expect(received).toEqual(['own'])
  })

  it('delivers its own message even before Redis has confirmed the subscription', () => {
    const received: string[] = []
    const subscription = db.subscribe('app_database_test_unconfirmed', (message) =>
      received.push(message),
    )
    db.publish('app_database_test_unconfirmed', 'early')
    expect(received).toEqual(['early'])
    return subscription
  })

  it('hands out one subscription per channel', async () => {
    const first = db.subscribe('app_database_test_one', () => undefined)
    const second = db.subscribe('app_database_test_one', () => undefined)
    expect(second).toBe(first)
    await first
  })

  it('delivers to every handler of a channel, and only for that channel', async () => {
    const first: string[] = []
    const second: string[] = []
    const other: string[] = []
    await Promise.all([
      db.subscribe('app_database_test_shared', (message) => first.push(message)),
      db.subscribe('app_database_test_shared', (message) => second.push(message)),
      db.subscribe('app_database_test_other', (message) => other.push(message)),
    ])

    await publishFromElsewhere('app_database_test_shared', 'shared')
    await sleep(100)

    expect(first).toEqual(['shared'])
    expect(second).toEqual(['shared'])
    expect(other).toEqual([])
  })

  it('delivers only once to a handler subscribed twice', async () => {
    const messages: string[] = []
    const handler = (message: string) => messages.push(message)
    await db.subscribe('app_database_test_twice', handler)
    await db.subscribe('app_database_test_twice', handler)

    await publishFromElsewhere('app_database_test_twice', 'once')
    await sleep(100)

    expect(messages).toEqual(['once'])
  })

  it('forgets all subscriptions on destroy', async () => {
    const before: string[] = []
    const after: string[] = []
    const old = db.subscribe('app_database_test_reinit', (message) => before.push(message))
    await old
    await db.destroy()
    await db.init()
    const renewed = db.subscribe('app_database_test_reinit', (message) => after.push(message))
    expect(renewed).not.toBe(old)
    await renewed

    await publishFromElsewhere('app_database_test_reinit', 'after reinit')
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

  it('publishes without Redis, too', async () => {
    await db.destroy()
    expect(() => db.publish('app_database_test_no_redis', 'nobody listens')).not.toThrow()
    await db.init()
  })
})
