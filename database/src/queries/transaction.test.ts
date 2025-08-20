import { AppDatabase } from '../AppDatabase'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { getLastTransaction } from './transaction'
import { Transaction as DbTransaction } from '..'

const db = AppDatabase.getInstance()

beforeAll(async () => {
  await db.init()
})
afterAll(async () => {
  await db.destroy()
})

describe('getLastTransaction', () => {
  describe('with empty table', () => {
    it('should return null if no transaction exists', async () => {
      const transaction = await getLastTransaction(1)
      expect(transaction).toBeNull()
    })
  })
  describe('with transactions', () => {
    beforeAll(async () => {
      await DbTransaction.clear()
    })
    it('should return the last transaction', async () => {
      const transaction = await getLastTransaction(1)
      expect(transaction).toBeDefined()
    })
  })
})