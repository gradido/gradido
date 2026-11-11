// AI-GENERATED — not an architecture reference
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import Redis from 'ioredis'
import { AppDatabase } from './AppDatabase'
import { CONFIG } from './config'

// What another program on the same Redis sees: a connection without the prefix.
let plain: Redis
const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
  plain = new Redis(CONFIG.REDIS_URL)
})

afterAll(async () => {
  await plain.quit()
  await db.destroy()
})

describe('AppDatabase in Redis', () => {
  it('keeps its keys under the name of the database', async () => {
    await db.getRedisClient().set('APP_DATABASE_TEST_KEY', '1', 'PX', 10000)
    try {
      expect(await plain.exists(`${CONFIG.DB_DATABASE}:APP_DATABASE_TEST_KEY`)).toBe(1)
      expect(await plain.exists('APP_DATABASE_TEST_KEY')).toBe(0)
    } finally {
      await db.getRedisClient().del('APP_DATABASE_TEST_KEY')
    }
    expect(await plain.exists(`${CONFIG.DB_DATABASE}:APP_DATABASE_TEST_KEY`)).toBe(0)
  })

  it('hears the channel of its database only', async () => {
    const received: string[] = []
    await db.subscribe('app_database_test_prefix', (message) => received.push(message))
    // the same channel as another database, or a program without a prefix, would name it
    await plain.publish('app_database_test_prefix', 'no prefix')
    await plain.publish('another_database:app_database_test_prefix', 'another database')
    await plain.publish(`${CONFIG.DB_DATABASE}:app_database_test_prefix`, 'this database')
    for (let attempt = 0; attempt < 50 && received.length === 0; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(received).toEqual(['this database'])
  })
})
