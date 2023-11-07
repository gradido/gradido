import { Transaction } from '@entity/Transaction'
import { TransactionRecipeRole } from './TransactionRecipe.role'

describe('interactions/gradidoNodeToDb/TransactionRecipeRole', () => {
  describe('test isAlreadyConfirmed', () => {
    it('with runningHash set to undefined', () => {
      const role = new TransactionRecipeRole(new Transaction())
      expect(role.isAlreadyConfirmed()).toBe(false)
    })
    it('with runningHash defined but empty', () => {
      const transaction = new Transaction()
      transaction.runningHash = Buffer.alloc(0)
      const role = new TransactionRecipeRole(transaction)
      expect(role.isAlreadyConfirmed()).toBe(false)
    })
    it('with proper running hash', () => {
      const transaction = new Transaction()
      transaction.runningHash = Buffer.from(
        '0340a61fbdf56de0919d6a8102dfd61b63a753f8015e813cbe9a15fa6f44a5d0',
        'hex',
      )
      const role = new TransactionRecipeRole(transaction)
      expect(role.isAlreadyConfirmed()).toBe(true)
    })
    it('with wrong sized runningHash', () => {
      const transaction = new Transaction()
      transaction.runningHash = Buffer.from(
        '0340a61fbdf56de0919d6a810015e813cbe9a15fa6f44a5d0',
        'hex',
      )
      const role = new TransactionRecipeRole(transaction)
      expect(role.isAlreadyConfirmed()).toBe(false)
    })
  })
})
