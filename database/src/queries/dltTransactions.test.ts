import { GradidoUnit } from 'shared'
import { clearDatabase } from '../../migration/clear'
import {
  Contribution as DbContribution,
  Transaction as DbTransaction,
  TransactionLink as DbTransactionLink,
  User as DbUser,
  DltTransactionType,
  TransactionTypeId,
} from '..'
import { AppDatabase } from '../AppDatabase'
import { createCommunity } from '../seeds/community'
import { creationFactory, nMonthsBefore } from '../seeds/factory/creation'
import { transferGradidos } from '../seeds/factory/transaction'
import { createTransactionLink } from '../seeds/factory/transactionLink'
import { userFactory } from '../seeds/factory/user'
import { transactionLinks } from '../seeds/transactionLink'
import { bibiBloxberg } from '../seeds/users/bibi-bloxberg'
import { peterLustig } from '../seeds/users/peter-lustig'
import {
  dbInsertDltTransaction,
  dbSelectDltTransactionWithTransaction,
  dbSelectDltTransactionWithTransactionLink,
  dbSelectDltTransactionWithUser,
  dbUpdateWithErrorDltTransaction,
} from './dltTransactions'

const appDB = AppDatabase.getInstance()

let bibi: DbUser
let peter: DbUser
let contribution: DbContribution
let transferTransactions: DbTransaction[] = []
let transactionLink: DbTransactionLink

beforeAll(async () => {
  // biome-ignore lint/suspicious/noConsole: measure time
  console.time('beforeAll')
  await appDB.init()
  await clearDatabase()

  // fill db with test data
  await createCommunity(false)
  bibi = await userFactory(bibiBloxberg)
  peter = await userFactory(peterLustig)

  contribution = await creationFactory(
    {
      email: 'bibi@bloxberg.de',
      amount: 1000,
      memo: 'Herzlich Willkommen bei Gradido!',
      contributionDate: nMonthsBefore(new Date()),
      confirmed: true,
      moveCreationDate: 12,
    },
    bibi,
    peter,
  )
  // 100,0000 GDD
  transferTransactions = await transferGradidos(
    bibi,
    peter,
    new GradidoUnit(100000n),
    'Test Transaction',
    new Date(),
  )

  transactionLink = await createTransactionLink(transactionLinks[0], bibi.id)
  // biome-ignore lint/suspicious/noConsole: measure time
  console.timeEnd('beforeAll')
})

afterAll(async () => {
  await clearDatabase()
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
    it('insert dlt transaction with user and test select', async () => {
      const insertResult = await dbInsertDltTransaction({
        hieroTransactionId: 'hiero-id-user',
        userId: bibi.id,
        typeId: DltTransactionType.REGISTER_ADDRESS,
      })
      expect(insertResult.success).toBeTruthy()

      const result = await dbSelectDltTransactionWithUser('hiero-id-user')
      expect(result.success).toBeTruthy()
      if (result.success) {
        const dltTransaction = result.value.dltTransaction
        expect(dltTransaction.hieroTransactionId).toBe('hiero-id-user')
        const user = result.value.user
        expect(user.id).toBe(bibi.id)
      }
    })

    it('insert dlt transaction with creation and test select', async () => {
      const insertResult = await dbInsertDltTransaction({
        hieroTransactionId: 'hiero-id',
        transactionId: contribution!.transactionId,
        typeId: DltTransactionType.CREATION,
      })
      expect(insertResult.success).toBeTruthy()

      const result = await dbSelectDltTransactionWithTransaction('hiero-id')
      expect(result.success).toBeTruthy()
      if (result.success) {
        const dltTransaction = result.value.dltTransaction
        expect(dltTransaction.hieroTransactionId).toBe('hiero-id')
        const transaction = result.value.transaction
        expect(transaction.id).toBe(contribution!.transactionId)
        const user = result.value.user
        expect(user.id).toBe(contribution!.userId)
        const linkedUser = result.value.linkedUser
        expect(linkedUser.id).toBe(peter.id)
      }
    })

    it('insert dlt transaction with transfer and test select', async () => {
      const insertResult = await dbInsertDltTransaction({
        hieroTransactionId: 'hiero-id-transfer',
        transactionId: transferTransactions[0].id,
        typeId: DltTransactionType.TRANSFER,
      })
      expect(insertResult.success).toBeTruthy()

      const result = await dbSelectDltTransactionWithTransaction('hiero-id-transfer')
      expect(result.success).toBeTruthy()
      if (result.success) {
        const dltTransaction = result.value.dltTransaction
        expect(dltTransaction.hieroTransactionId).toBe('hiero-id-transfer')
        const transaction = result.value.transaction
        expect(transaction.id).toBe(transferTransactions[0].id)
        expect(transaction.typeId).toBe(TransactionTypeId.SEND)
        const user = result.value.user
        expect(user.id).toBe(bibi.id)
        const linkedUser = result.value.linkedUser
        expect(linkedUser.id).toBe(peter.id)
      }
    })

    it('insert dlt transaction with transaction link and test select', async () => {
      const insertResult = await dbInsertDltTransaction({
        hieroTransactionId: 'hiero-id-transaction-link',
        transactionLinkId: transactionLink.id,
        typeId: DltTransactionType.DEFERRED_TRANSFER,
      })
      expect(insertResult.success).toBeTruthy()

      const result = await dbSelectDltTransactionWithTransactionLink('hiero-id-transaction-link')
      expect(result.success).toBeTruthy()
      if (result.success) {
        const dltTransaction = result.value.dltTransaction
        expect(dltTransaction.hieroTransactionId).toBe('hiero-id-transaction-link')
        const transactionLink = result.value.transactionLink
        expect(transactionLink.id).toBe(transactionLink.id)
        const user = result.value.user
        expect(user.id).toBe(bibi.id)
      }
    })
  })

  describe('select - error paths', () => {
    it('returns DBNotFoundError when hieroTransactionId does not exist', async () => {
      const result = await dbSelectDltTransactionWithTransaction('non-existent-id')
      expect(result.success).toBeFalsy()
      if (!result.success) {
        expect(result.error.name).toBe('DBNotFoundError')
        expect(result.error.table).toBe('dlt_transactions')
        expect(result.error.where).toContain('non-existent-id')
      }
    })

    it('returns DBMissingJoin when transactionId is set but transaction does not exist', async () => {
      // Insert a DLT transaction with a non-existent transactionId
      await dbInsertDltTransaction({
        hieroTransactionId: 'orphan-transaction',
        transactionId: 999999, // This ID does not exist in the transactions table
        typeId: DltTransactionType.TRANSFER,
      })

      const result = await dbSelectDltTransactionWithTransaction('orphan-transaction')
      expect(result.success).toBeFalsy()
      if (!result.success) {
        expect(result.error.name).toBe('DBMissingJoin')
        expect(result.error.table).toBe('dlt_transactions')
        expect(result.error.joinTable).toBe('transaction')
      }
    })

    it('returns DBMissingJoin when userId is set but user does not exist', async () => {
      await dbInsertDltTransaction({
        hieroTransactionId: 'orphan-user',
        userId: 999999, // This ID does not exist
        typeId: DltTransactionType.REGISTER_ADDRESS,
      })

      const result = await dbSelectDltTransactionWithUser('orphan-user')
      expect(result.success).toBeFalsy()
      if (!result.success) {
        expect(result.error.name).toBe('DBMissingJoin')
        expect(result.error.joinTable).toBe('user')
      }
    })

    it('returns DBMissingJoin when transactionLinkId is set but link does not exist', async () => {
      await dbInsertDltTransaction({
        hieroTransactionId: 'orphan-link',
        transactionLinkId: 999999,
        typeId: DltTransactionType.DEFERRED_TRANSFER,
      })

      const result = await dbSelectDltTransactionWithTransactionLink('orphan-link')
      expect(result.success).toBeFalsy()
      if (!result.success) {
        expect(result.error.name).toBe('DBMissingJoin')
        expect(result.error.joinTable).toBe('transactionLink')
      }
    })
  })

  describe('update - error paths', () => {
    it('returns DBNotFoundError when updating non-existent hieroTransactionId', async () => {
      const result = await dbUpdateWithErrorDltTransaction('ghost-id', 'some error')
      expect(result.success).toBeFalsy()
      if (!result.success) {
        expect(result.error.name).toBe('DBNotFoundError')
        expect(result.error.table).toBe('dlt_transactions')
      }
    })
  })

  describe('select - edge cases', () => {
    it('handles empty string as hieroTransactionId gracefully', async () => {
      const result = await dbSelectDltTransactionWithTransaction('')
      expect(result.success).toBeFalsy()
      if (!result.success) {
        expect(result.error).toBeDefined()
        expect(result.error.message).toBe(
          'DB_NOT_FOUND in dlt_transactions where: hieroTransactionId = ',
        )
      }
    })

    it('handles very long hieroTransactionId gracefully', async () => {
      const longId = 'a'.repeat(1000)
      const result = await dbSelectDltTransactionWithTransaction(longId)
      expect(result.success).toBeFalsy()
      expect(result.error.name).toBe('DBNotFoundError')
      // Should not crash, but return an error
    })
  })
})
