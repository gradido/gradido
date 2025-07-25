import { Transaction as DbTransaction } from 'database'
import { Decimal } from 'decimal.js-light'
import { DataSource } from 'typeorm'

import { cleanDB, testEnvironment } from '@test/helpers'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'

import { DltConnectorClient } from './DltConnectorClient'

let con: DataSource

let testEnv: {
  con: DataSource
}

// Mock the GraphQLClient
jest.mock('graphql-request', () => {
  const originalModule = jest.requireActual('graphql-request')

  return {
    __esModule: true,
    ...originalModule,
    GraphQLClient: jest.fn().mockImplementation((url: string) => {
      if (url === 'invalid') {
        throw new Error('invalid url')
      }
      return {
        // why not using mockResolvedValueOnce or mockReturnValueOnce?
        // I have tried, but it didn't work and return every time the first value
        request: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            transmitTransaction: {
              succeed: true,
            },
          })
        }),
      }
    }),
  }
})

describe('undefined DltConnectorClient', () => {
  it('invalid url', () => {
    CONFIG.DLT_CONNECTOR_URL = 'invalid'
    CONFIG.DLT_CONNECTOR = true
    const result = DltConnectorClient.getInstance()
    expect(result).toBeUndefined()
    CONFIG.DLT_CONNECTOR_URL = 'http://dlt-connector:6010'
  })

  it('DLT_CONNECTOR is false', () => {
    CONFIG.DLT_CONNECTOR = false
    const result = DltConnectorClient.getInstance()
    expect(result).toBeUndefined()
    CONFIG.DLT_CONNECTOR = true
  })
})

/*
describe.skip('transmitTransaction, without db connection', () => {
  const transaction = new DbTransaction()
  transaction.typeId = 2 // Example transaction type ID
  transaction.amount = new Decimal('10.00') // Example amount
  transaction.balanceDate = new Date() // Example creation date
  transaction.id = 1 // Example transaction ID

  it('cannot query for transaction id', async () => {
    const result = await DltConnectorClient.getInstance()?.transmitTransaction(transaction)
    expect(result).toBe(false)
  })
})
*/

describe('transmitTransaction', () => {
  beforeAll(async () => {
    testEnv = await testEnvironment()
    con = testEnv.con
    await cleanDB()
  })

  afterAll(async () => {
    await cleanDB()
    await con.destroy()
  })

  const transaction = new DbTransaction()
  transaction.typeId = 2 // Example transaction type ID
  transaction.amount = new Decimal('10.00') // Example amount
  transaction.balanceDate = new Date() // Example creation date
  transaction.id = 1 // Example transaction ID

  // data needed to let save succeed
  transaction.memo = "I'm a dummy memo"
  transaction.userId = 1
  transaction.userGradidoID = 'dummy gradido id'

  /*
  it.skip('cannot find transaction in db', async () => {
    const result = await DltConnectorClient.getInstance()?.transmitTransaction(transaction)
    expect(result).toBe(false)
  })
  */

  it('invalid transaction type', async () => {
    const localTransaction = new DbTransaction()
    localTransaction.typeId = 12
    try {
      await DltConnectorClient.getInstance()?.transmitTransaction(localTransaction)
    } catch (e) {
      expect(e).toMatchObject(
        new LogError(`invalid transaction type id: ${localTransaction.typeId.toString()}`),
      )
    }
  })

  /*
  it.skip('should transmit the transaction and update the dltTransactionId in the database', async () => {
    await transaction.save()

    const result = await DltConnectorClient.getInstance()?.transmitTransaction(transaction)
    expect(result).toBe(true)
  })

  it.skip('invalid dltTransactionId (maximal 32 Bytes in Binary)', async () => {
    await transaction.save()

    const result = await DltConnectorClient.getInstance()?.transmitTransaction(transaction)
    expect(result).toBe(false)
  })
  */
})

/*
describe.skip('try transmitTransaction but graphql request failed', () => {
  it('graphql request should throw', async () => {
    const transaction = new DbTransaction()
    transaction.typeId = 2 // Example transaction type ID
    transaction.amount = new Decimal('10.00') // Example amount
    transaction.balanceDate = new Date() // Example creation date
    transaction.id = 1 // Example transaction ID
    const result = await DltConnectorClient.getInstance()?.transmitTransaction(transaction)
    expect(result).toBe(false)
  })
})
*/
