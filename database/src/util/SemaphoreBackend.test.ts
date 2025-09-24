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

describe('create several backend-semaphores with same key', async () => {
    it('first one perhaps with different owner', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'backend-test-1')
      console.log('TEST_LOCK', TEST_LOCK);
      expect(TEST_LOCK).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
      })
    })
    it('with one entity in db', async () => {
      const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
      console.log('result', result);
      expect(result).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
      })
    })
    it('second one perhaps with different owner', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'backend-test-2')
      expect(TEST_LOCK).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
      })
    })
    it('still one entity in db', async () => {
        const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
        expect(result).toMatchObject({
          key: 'TEST_LOCK',
          count: 1,
        })
      })
  })

  describe('acquire several backend-semaphores with same key', async () => {
    it('first one acquired', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'backend-test-1')
      console.log('TEST_LOCK', TEST_LOCK);
      const releaseLock = await TEST_LOCK.acquire()
      try {
        console.log('first one acquired and waiting...time=', new Date().toISOString());
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('end waiting...time=', new Date().toISOString());
        expect(releaseLock).toBeInstanceOf(Function)
      } catch (error) {
        console.error('acquire failed', error);
      } finally {
        releaseLock()
      }
    })
    it('look after first semaphore in db', async () => {
      const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
      console.log('result', result);
      expect(result).toMatchObject({
        key: 'TEST_LOCK',
      })
    })
    it('second one acquired', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'backend-test-2')
      const releaseLock = await TEST_LOCK.acquire()
      try {
        console.log('second one acquired and waiting...time=', new Date().toISOString());
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('end waiting...time=', new Date().toISOString());
        expect(releaseLock).toBeInstanceOf(Function)
      } catch (error) {
        console.error('acquire failed', error);
      } finally {
        releaseLock()
      }
    })
    it('look after second semaphore in db', async () => {
        const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
        expect(result).toMatchObject({
          key: 'TEST_LOCK',
        })
      })
  })
