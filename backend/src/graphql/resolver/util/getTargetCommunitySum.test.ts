/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable jest/valid-expect */
import { Connection } from '@dbTools/typeorm'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { cleanDB, testEnvironment } from '@test/helpers'

import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { backendLogger as logger } from '@/server/logger'

import { getTargetCommunitySum } from './getTargetCommunitySum'

let con: Connection

let testEnv: {
  con: Connection
}

async function creationTransaction(
  id: number,
  type: TransactionTypeId,
  amount: number,
  createdAt: Date,
  communitySum: Decimal,
) {
  const transaction = new DbTransaction()
  transaction.id = id
  transaction.userId = 1
  transaction.userGradidoID = 'dummy gradido id'
  transaction.typeId = type
  transaction.amount = new Decimal(amount)
  transaction.balanceDate = createdAt
  transaction.communitySum = communitySum
  transaction.memo = 'dummy memo'
  await transaction.save()
}

describe('resolver/util/getTargetCommunitySum', () => {
  beforeAll(async () => {
    testEnv = await testEnvironment(logger)
    con = testEnv.con
    await cleanDB()
  })

  afterAll(async () => {
    await cleanDB()
    await con.close()
  })
  it('no transaction in db', async () => {
    expect(await getTargetCommunitySum(new Date())).toMatchObject(new Decimal('0'))
  })
  describe('with some transactions in db', () => {
    beforeAll(async () => {
      await creationTransaction(
        1,
        TransactionTypeId.CREATION,
        1000,
        new Date('2023-07-18 10:10:37.903+00:00'),
        new Decimal(1000),
      )
      await creationTransaction(
        2,
        TransactionTypeId.CREATION,
        40,
        new Date('2023-07-18 10:10:59.079+00:00'),
        new Decimal('1039.99953487012047522035'),
      )
      await creationTransaction(
        3,
        TransactionTypeId.SEND,
        -100,
        new Date('2023-07-18 10:11:30.575+00:00'),
        new Decimal('1039.99881538998390068613'),
      )
      await creationTransaction(
        4,
        TransactionTypeId.RECEIVE,
        100,
        new Date('2023-07-18 10:11:30.575+00:00'),
        new Decimal('1039.99881538998390068613'),
      )
    })
    it('check community sum between two creations', async () => {
      const result = await getTargetCommunitySum(new Date('2023-07-18 10:10:40+00:00'))
      expect(result.toString()).toBe(new Decimal('999.999953939480461895055').toString())
    })

    it('check community sum in future', async () => {
      const result = await getTargetCommunitySum(new Date('2024-07-18 10:10:40+00:00'))
      expect(result.toString()).toBe(new Decimal('519.2529898306532521802437').toString())
    })
  })
})
