/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Connection } from '@dbTools/typeorm'
import { Event as DbEvent } from '@entity/Event'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { Decimal } from 'decimal.js-light'
import { GraphQLError } from 'graphql'

import { cleanDB, testEnvironment } from '@test/helpers'
import { logger } from '@test/testSetup'

import { EventType } from '@/event/Events'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmContribution,
  createContribution,
  login,
  sendCoins,
  updateUserInfos,
} from '@/seeds/graphql/mutations'
import { transactionsQuery } from '@/seeds/graphql/queries'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'

let mutate: ApolloServerTestClient['mutate'], con: Connection
let query: ApolloServerTestClient['query']

let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

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

let bob: User
let peter: User

describe('send coins', () => {
  beforeAll(async () => {
    peter = await userFactory(testEnv, peterLustig)
    bob = await userFactory(testEnv, bobBaumeister)
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
            identifier: 'wrong@email.com',
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
              identifier: 'stephen@hawking.uk',
              amount: 100,
              memo: 'test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('No user to given contact')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('No user to given contact', 'stephen@hawking.uk')
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
              identifier: 'garrick@ollivander.com',
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
        expect(logger.error).toBeCalledWith(
          'No user with this credentials',
          'garrick@ollivander.com',
        )
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
              identifier: 'bob@baumeister.de',
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
              identifier: 'peter@lustig.de',
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
              identifier: 'peter@lustig.de',
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
              identifier: 'peter@lustig.de',
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
      await mutate({ mutation: login, variables: peterData })

      // confirm the contribution
      await mutate({
        mutation: confirmContribution,
        variables: { id: contribution.data.createContribution.id },
      })

      // login as bob again
      await mutate({ mutation: login, variables: bobData })
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
              identifier: 'peter@lustig.de',
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
              identifier: 'peter@lustig.de',
              amount: 50,
              memo: 'unrepeatable memo',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            data: {
              sendCoins: true,
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

        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.TRANSACTION_SEND,
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

        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.TRANSACTION_RECEIVE,
            affectedUserId: user[0].id,
            actingUserId: user[1].id,
            involvedUserId: user[1].id,
            involvedTransactionId: transaction[0].id,
          }),
        )
      })
    })

    describe('send coins via gradido ID', () => {
      it('sends the coins', async () => {
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              identifier: peter?.gradidoID,
              amount: 10,
              memo: 'send via gradido ID',
            },
          }),
        ).resolves.toMatchObject({
          data: {
            sendCoins: true,
          },
          errors: undefined,
        })
      })
    })

    describe('send coins via alias', () => {
      beforeAll(async () => {
        await mutate({
          mutation: updateUserInfos,
          variables: {
            alias: 'bob',
          },
        })
        await mutate({
          mutation: login,
          variables: peterData,
        })
      })

      afterAll(async () => {
        await mutate({
          mutation: login,
          variables: bobData,
        })
      })

      it('sends the coins', async () => {
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              identifier: 'bob',
              amount: 6.66,
              memo: 'send via alias',
            },
          }),
        ).resolves.toMatchObject({
          data: {
            sendCoins: true,
          },
          errors: undefined,
        })
      })

      describe("peter's transactions", () => {
        it('has all expected transactions', async () => {
          await expect(query({ query: transactionsQuery })).resolves.toMatchObject({
            data: {
              transactionList: {
                balance: expect.any(Object),
                transactions: [
                  expect.objectContaining({
                    typeId: 'DECAY',
                  }),
                  expect.objectContaining({
                    amount: expect.decimalEqual(-6.66),
                    linkedUser: {
                      firstName: 'Bob',
                      gradidoID: bob?.gradidoID,
                      lastName: 'der Baumeister',
                    },
                    memo: 'send via alias',
                    typeId: 'SEND',
                  }),
                  expect.objectContaining({
                    amount: expect.decimalEqual(10),
                    linkedUser: {
                      firstName: 'Bob',
                      gradidoID: bob?.gradidoID,
                      lastName: 'der Baumeister',
                    },
                    memo: 'send via gradido ID',
                    typeId: 'RECEIVE',
                  }),
                  expect.objectContaining({
                    amount: expect.decimalEqual(50),
                    linkedUser: {
                      firstName: 'Bob',
                      gradidoID: bob?.gradidoID,
                      lastName: 'der Baumeister',
                    },
                    memo: 'unrepeatable memo',
                    typeId: 'RECEIVE',
                  }),
                ],
              },
            },
            errors: undefined,
          })
        })
      })
    })

    describe('more transactions to test semaphore', () => {
      it('sends the coins four times in a row', async () => {
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              identifier: 'peter@lustig.de',
              amount: 10,
              memo: 'first transaction',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              sendCoins: true,
            },
          }),
        )
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              identifier: 'peter@lustig.de',
              amount: 20,
              memo: 'second transaction',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              sendCoins: true,
            },
          }),
        )
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              identifier: 'peter@lustig.de',
              amount: 30,
              memo: 'third transaction',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              sendCoins: true,
            },
          }),
        )
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              identifier: 'peter@lustig.de',
              amount: 40,
              memo: 'fourth transaction',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              sendCoins: true,
            },
          }),
        )
      })
    })
  })
})

describe('transactionList', () => {
  describe('unauthenticated', () => {
    it('throws an error', async () => {
      await expect(query({ query: transactionsQuery })).resolves.toMatchObject({
        errors: [new GraphQLError('401 Unauthorized')],
      })
    })
  })

  describe('authenticated', () => {
    describe('no transactions', () => {
      beforeAll(async () => {
        await userFactory(testEnv, bobBaumeister)
        await mutate({
          mutation: login,
          variables: {
            email: 'bob@baumeister.de',
            password: 'Aa12345_',
          },
        })
      })

      it('has no transactions and balance 0', async () => {
        await expect(query({ query: transactionsQuery })).resolves.toMatchObject({
          data: {
            transactionList: {
              balance: expect.objectContaining({
                balance: expect.decimalEqual(0),
              }),
              transactions: [],
            },
          },
          errors: undefined,
        })
      })
    })
  })
})
