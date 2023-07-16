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
  amount: number,
  createdAt: Date,
  communitySum: Decimal,
) {
  const transaction = new DbTransaction()
  transaction.id = id
  transaction.typeId = TransactionTypeId.CREATION
  transaction.amount = new Decimal(amount)
  transaction.balanceDate = createdAt
  transaction.communitySum = communitySum
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
  it('no transaction in db', () => {
    expect(getTargetCommunitySum(new Date())).toBe(new Decimal('0'))
  })
  describe('with some transactions in db', () => {
    beforeAll(async () => {
      await creationTransaction(1, 100, new Date('2023-01-01 12:10:01+00:00'), new Decimal(100))
    })
  })
})
