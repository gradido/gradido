import { eq, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { DltTransactionType } from '../'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { dltTransactionsTable } from '../schemas'
import {
  dbInsertDltTransaction,
  dbSelectDltTransactionByHieroTransactionId,
  dbUpdateWithErrorDltTransaction,
} from './dltTransactions'

const appDB = AppDatabase.getInstance()
let db: MySql2Database

beforeAll(async () => {
  await appDB.init()
  db = drizzleDb()
  await db.execute(sql`TRUNCATE ${dltTransactionsTable};`)
})
afterAll(async () => {
  await db.execute(sql`TRUNCATE ${dltTransactionsTable};`)
  await appDB.destroy()
})

describe('dlt transactions query test', () => {
  describe('insert', () => {
    it('insert with type id only', async () => {
      const result = await dbInsertDltTransaction({ typeId: DltTransactionType.TRANSFER })
      expect(result.success).toBeTruthy()
    })
    it('insert second time with same id throw', async () => {
      expect(() =>
        dbInsertDltTransaction({ id: 1, typeId: DltTransactionType.TRANSFER }),
      ).toThrowError()
    })
  })
  describe('update', () => {
    it('insert entry and then update ', async () => {
      const result = await dbInsertDltTransaction({
        typeId: DltTransactionType.TRANSFER,
        hieroTransactionId: 'id',
      })
      expect(result.success).toBeTruthy()
      const result2 = await dbUpdateWithErrorDltTransaction('id', 'error')
      expect(result2.success)
    })
  })
  describe('select', () => {
    it('select entry from last test', async () => {
      const result = await dbSelectDltTransactionByHieroTransactionId('id')
      expect(result.success).toBeTruthy()
    })
    it('error on not existing id', async () => {
      const result = await dbSelectDltTransactionByHieroTransactionId('missingId')
      expect(result.success).toBeFalsy()
      if (!result.success) {
        expect(result.error.where).toBe(`hieroTransactionId = missingId`)
      }
    })
  })
})
