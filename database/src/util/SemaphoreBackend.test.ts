import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { AppDatabase } from '../AppDatabase'
import { Semaphore } from './Semaphore'
import { Semaphore as DbSemaphore } from '../entity/Semaphore'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init('backend-test')
  if(db.getDataSource().isInitialized) {
    console.log('Database is initialized')
    await DbSemaphore.clear()
  }
})
afterAll(async () => {
  // await db.destroy()
})

describe('create several backend-semaphores with same key', async () => {
    it('should create a semaphore with TEST_LOCK key', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'test-owner');
      expect(TEST_LOCK).toBeInstanceOf(Semaphore);
    });
    it('create first one', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'test-backend')
      console.log('TEST_LOCK', TEST_LOCK);
      expect(TEST_LOCK).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
        owner: 'test-backend',
        tasks: []
      });
    })
    it('with no entity in db', async () => {
      const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
      console.log('result', result);
      expect(result).toBeNull()
    })
    it('create second one', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'test-backend')
      expect(TEST_LOCK).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
        owner: 'test-backend',
        tasks: []
      })
    })
    it('still no entity in db', async () => {
      const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
      console.log('result', result);
      expect(result).toBeNull()
    })
  })

  describe('acquire several backend-semaphores with same key', async () => {
    beforeAll(async () => {
      await DbSemaphore.clear()
    })
    it('first one acquired', async () => {
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'test-backend')
      console.log('TEST_LOCK', TEST_LOCK);
      const releaseLock = await TEST_LOCK.acquire()
      console.log('releaseLock', releaseLock);
/*
      const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
      console.log('result', result);
      expect(result).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
      })
*/
      try {
        console.log('first one acquired and processing...time=', new Date().toISOString());
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('end processing...time=', new Date().toISOString());
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
      const TEST_LOCK = await Semaphore.create('TEST_LOCK', 1, 'test-backend')
      console.log('TEST_LOCK', TEST_LOCK);
      const releaseLock = await TEST_LOCK.acquire()
      console.log('releaseLock', releaseLock);
/*
      const result = await DbSemaphore.findOneBy({ key: 'TEST_LOCK' })
      console.log('result', result);
      expect(result).toMatchObject({
        key: 'TEST_LOCK',
        count: 1,
      })
*/
      try {
        console.log('second one acquired and processing...time=', new Date().toISOString());
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('end processing...time=', new Date().toISOString());
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
