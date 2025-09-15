import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { AppDatabase } from '../AppDatabase'
import { Semaphore } from './Semaphore'
import { Semaphore as DbSemaphore } from '../entity/Semaphore'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
  if(db.getDataSource().isInitialized) {
    console.log('Database is initialized')
    await DbSemaphore.clear()
  }
})
afterAll(async () => {
  await db.destroy()
})

describe('create several semaphores with same key', () => {
    it('first one succeeds', async () => {
      const TEST_LOCK = new Semaphore('TEST_LOCK', 1, 'test-1')
      expect(TEST_LOCK).toEqual({
        key: 'TEST_LOCK',
        count: 1,
        owner: 'test-1',
      })
    })
    it.skip('with one entity in db', async () => {
      const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
      expect(result).toEqual({
        key: 'TEST_LOCK',
        count: 1,
        owner: 'test-1',
      })
    })
    it.skip('second one returns semaphore with first owner', async () => {
      const TEST_LOCK = new Semaphore('TEST_LOCK', 1, 'test-2')
      expect(TEST_LOCK).toEqual({
        key: 'TEST_LOCK',
        count: 1,
        owner: 'test-1',
      })
    })
    it.skip('still one entity in db', async () => {
        const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
        expect(result).toEqual({
          key: 'TEST_LOCK',
          count: 1,
          owner: 'test-1',
        })
      })
  })
