/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Decimal from 'decimal.js-light'
import { EventProtocolType } from '@/event/EventProtocolType'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmContribution,
  createContribution,
  login,
  sendCoins,
} from '@/seeds/graphql/mutations'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { Event as DbEvent } from '@entity/Event'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'
import { cleanDB, testEnvironment } from '@test/helpers'
import { logger } from '@test/testSetup'
import { GraphQLError } from 'graphql'
import { findUserByEmail } from './UserResolver'

let mutate: any, query: any, con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

let bobData: any
let peterData: any
let user: User[]

describe('send coins', () => {
  beforeAll(async () => {
    await userFactory(testEnv, peterLustig)
    await userFactory(testEnv, bobBaumeister)
    await userFactory(testEnv, stephenHawking)
    await userFactory(testEnv, garrickOllivander)

    bobData = {
      email: 'bob@baumeister.de',
      password: 'Aa12345_',
    }

    peterData = {
      email: 'peter@lustig.de',
      password: 'Aa12345_',
    }

    user = await User.find({ relations: ['emailContact'] })
  })

  afterAll(async () => {
    await cleanDB()
  })

  describe('unknown recipient', () => {
    it('throws an error', async () => {
      jest.clearAllMocks()
      await mutate({
        mutation: login,
        variables: bobData,
      })
      expect(
        await mutate({
          mutation: sendCoins,
          variables: {
            email: 'wrong@email.com',
            amount: 100,
            memo: 'test',
          },
        }),
      ).toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('No user with this credentials')],
        }),
      )
    })

    it('logs the error thrown', () => {
      expect(logger.error).toBeCalledWith('No user with this credentials', 'wrong@email.com')
    })

    describe('deleted recipient', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        await mutate({
          mutation: login,
          variables: peterData,
        })

        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'stephen@hawking.uk',
              amount: 100,
              memo: 'test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('The recipient account was deleted')],
          }),
        )
      })

      it('logs the error thrown', async () => {
        // find peter to check the log
        const user = await findUserByEmail('stephen@hawking.uk')
        expect(logger.error).toBeCalledWith('The recipient account was deleted', user)
      })
    })

    describe('recipient account not activated', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        await mutate({
          mutation: login,
          variables: peterData,
        })

        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'garrick@ollivander.com',
              amount: 100,
              memo: 'test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('The recipient account is not activated')],
          }),
        )
      })

      it('logs the error thrown', async () => {
        // find peter to check the log
        const user = await findUserByEmail('garrick@ollivander.com')
        expect(logger.error).toBeCalledWith('The recipient account is not activated', user)
      })
    })
  })

  describe('errors in the transaction itself', () => {
    beforeAll(async () => {
      await mutate({
        mutation: login,
        variables: bobData,
      })
    })

    describe('sender and recipient are the same', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'bob@baumeister.de',
              amount: 100,
              memo: 'test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Sender and Recipient are the same')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('Sender and Recipient are the same', expect.any(Number))
      })
    })

    describe('memo text is too short', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 100,
              memo: 'test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Memo text is too short')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('Memo text is too short', 4)
      })
    })

    describe('memo text is too long', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 100,
              memo: 'test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test t',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Memo text is too long')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('Memo text is too long', 256)
      })
    })

    describe('user has not enough GDD', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 100,
              memo: 'testing',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('User has not enough GDD or amount is < 0')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('User has not enough GDD or amount is < 0', null)
      })
    })
  })

  describe('user has some GDD', () => {
    beforeAll(async () => {
      // create contribution as user bob
      const contribution = await mutate({
        mutation: createContribution,
        variables: { amount: 1000, memo: 'testing', creationDate: new Date().toISOString() },
      })

      // login as admin
      await query({ mutation: login, variables: peterData })

      // confirm the contribution
      await mutate({
        mutation: confirmContribution,
        variables: { id: contribution.data.createContribution.id },
      })

      // login as bob again
      await query({ mutation: login, variables: bobData })
    })

    afterAll(async () => {
      await cleanDB()
    })

    describe('trying to send negative amount', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: -50,
              memo: 'testing negative',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Amount to send must be positive')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('Amount to send must be positive', new Decimal(-50))
      })
    })

    describe('good transaction', () => {
      it('sends the coins', async () => {
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 50,
              memo: 'unrepeatable memo',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            data: {
              sendCoins: 'true',
            },
          }),
        )
      })

      it('stores the TRANSACTION_SEND event in the database', async () => {
        // Find the exact transaction (sent one is the one with user[1] as user)
        const transaction = await Transaction.find({
          userId: user[1].id,
          memo: 'unrepeatable memo',
        })

        expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventProtocolType.TRANSACTION_SEND,
            affectedUserId: user[1].id,
            actingUserId: user[1].id,
            involvedUserId: user[0].id,
            involvedTransactionId: transaction[0].id,
          }),
        )
      })

      it('stores the TRANSACTION_RECEIVE event in the database', async () => {
        // Find the exact transaction (received one is the one with user[0] as user)
        const transaction = await Transaction.find({
          userId: user[0].id,
          memo: 'unrepeatable memo',
        })

        expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventProtocolType.TRANSACTION_RECEIVE,
            affectedUserId: user[0].id,
            actingUserId: user[1].id,
            involvedUserId: user[1].id,
            involvedTransactionId: transaction[0].id,
          }),
        )
      })
    })

    describe('more transactions to test semaphore', () => {
      it('sends the coins four times in a row', async () => {
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 10,
              memo: 'first transaction',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              sendCoins: 'true',
            },
          }),
        )
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 20,
              memo: 'second transaction',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              sendCoins: 'true',
            },
          }),
        )
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 30,
              memo: 'third transaction',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              sendCoins: 'true',
            },
          }),
        )
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 40,
              memo: 'fourth transaction',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              sendCoins: 'true',
            },
          }),
        )
      })
    })
  })
})
