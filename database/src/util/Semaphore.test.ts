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
  // await db.destroy()
})

describe('create several semaphores with same key', async () => {
    it('first one succeeds', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'test-1')
      console.log('TEST_LOCK', TEST_LOCK);
      expect(TEST_LOCK).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
        owner: 'test-1',
      })
    })
    it('with one entity in db', async () => {
      const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
      console.log('result', result);
      expect(result).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
        owner: 'test-1',
      })
    })
    it('second one returns semaphore with first owner', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'test-2')
      expect(TEST_LOCK).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
        owner: 'test-1',
      })
    })
    it('still one entity in db', async () => {
        const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
        expect(result).toMatchObject({
          key: 'TEST_LOCK',
          count: 1,
          owner: 'test-1',
        })
      })
  })
