/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Connection } from '@dbTools/typeorm'
import { Transaction as DbTransaction } from '@entity/Transaction'
// import { jest } from '@jest/globals'
import { Decimal } from 'decimal.js-light'

import { cleanDB, testEnvironment } from '@test/helpers'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { transmitTransaction } from './DltConnection'

let con: Connection

let testEnv: {
  con: Connection
}

// Mock the GraphQLClient
jest.mock('graphql-request', () => {
  const originalModule = jest.requireActual('graphql-request')

  let testCursor = 0

  return {
    __esModule: true,
    ...originalModule,
    GraphQLClient: jest.fn().mockImplementation(() => ({
      // why not using mockResolvedValueOnce or mockReturnValueOnce?
      // I have tried, but it didn't work and return every time the first value
      request: jest.fn().mockImplementation(() => {
        testCursor++
        if (testCursor === 4) {
          return Promise.resolve(
            // invalid, is 33 Bytes long as binary
            {
              sendTransaction: '723e3fab62c5d3e2f62fd72ba4e622bcd53eff35262e3f3526327fe41bc516212A',
            },
          )
        } else {
          return Promise.resolve(
            // valid, is 32 Bytes long as binary
            {
              sendTransaction: '723e3fab62c5d3e2f62fd72ba4e622bcd53eff35262e3f3526327fe41bc51621',
            },
          )
        }
      }),
    })),
  }
})

beforeAll(() => {
  CONFIG.DLT_CONNECTOR = true
})

describe('transmitTransaction, without db connection', () => {
  const transaction = new DbTransaction()
  transaction.typeId = 2 // Example transaction type ID
  transaction.amount = new Decimal('10.00') // Example amount
  transaction.balanceDate = new Date() // Example creation date
  transaction.id = 1 // Example transaction ID

  it('cannot query for transaction id', async () => {
    const result = await transmitTransaction(transaction)
    expect(result).toBe(false)
  })
})

describe('transmitTransaction', () => {
  beforeAll(async () => {
    testEnv = await testEnvironment(logger)
    con = testEnv.con
    await cleanDB()
  })

  afterAll(async () => {
    await cleanDB()
    await con.close()
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

  it('cannot find transaction in db', async () => {
    const result = await transmitTransaction(transaction)
    expect(result).toBe(false)
  })

  it('invalid transaction type', async () => {
    const localTransaction = new DbTransaction()
    localTransaction.typeId = 12
    try {
      await transmitTransaction(localTransaction)
    } catch (e) {
      expect(e).toMatchObject(
        new LogError('invalid transaction type id: ' + localTransaction.typeId.toString()),
      )
    }
  })

  it('should transmit the transaction and update the dltTransactionId in the database', async () => {
    await transaction.save()

    const result = await transmitTransaction(transaction)
    expect(result).toBe(true)
  })

  it('invalid dltTransactionId (maximal 32 Bytes in Binary)', async () => {
    await transaction.save()

    const result = await transmitTransaction(transaction)
    expect(result).toBe(false)
  })
})

describe('transmitTransaction but DLT_CONNECTOR is disabled', () => {
  it('try with empty data', async () => {
    CONFIG.DLT_CONNECTOR = false
    const result = await transmitTransaction(new DbTransaction())
    expect(result).toBe(true)
  })
})
