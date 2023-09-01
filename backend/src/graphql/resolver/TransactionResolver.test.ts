/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Connection, In } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { DltTransaction } from '@entity/DltTransaction'
import { Event as DbEvent } from '@entity/Event'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'
import { ApolloServerTestClient } from 'apollo-server-testing'
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

let homeCom: DbCommunity
let foreignCom: DbCommunity

describe('send coins', () => {
  beforeAll(async () => {
    peter = await userFactory(testEnv, peterLustig)
    bob = await userFactory(testEnv, bobBaumeister)
    await userFactory(testEnv, stephenHawking)
    await userFactory(testEnv, garrickOllivander)
    homeCom = DbCommunity.create()
    homeCom.communityUuid = 'homeCom-UUID'
    homeCom.creationDate = new Date('2000-01-01')
    homeCom.description = 'homeCom description'
    homeCom.foreign = false
    homeCom.name = 'homeCom name'
    homeCom.privateKey = Buffer.from('homeCom privateKey')
    homeCom.publicKey = Buffer.from('homeCom publicKey')
    homeCom.url = 'homeCom url'
    homeCom = await DbCommunity.save(homeCom)

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
            recipientCommunityIdentifier: homeCom.communityUuid,
            recipientIdentifier: 'wrong@email.com',
            amount: 100,
            memo: 'test test',
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
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'stephen@hawking.uk',
              amount: 100,
              memo: 'test test',
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
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'garrick@ollivander.com',
              amount: 100,
              memo: 'test test',
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
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'bob@baumeister.de',
              amount: 100,
              memo: 'test test',
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
        const { errors: errorObjects } = await mutate({
          mutation: sendCoins,
          variables: {
            recipientCommunityIdentifier: homeCom.communityUuid,
            recipientIdentifier: 'peter@lustig.de',
            amount: 100,
            memo: 'Test',
          },
        })
        expect(errorObjects).toMatchObject([
          {
            message: 'Argument Validation Error',
            extensions: {
              exception: {
                validationErrors: [
                  {
                    property: 'memo',
                    constraints: {
                      minLength: 'memo must be longer than or equal to 5 characters',
                    },
                  },
                ],
              },
            },
          },
        ])
      })
    })

    describe('memo text is too long', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        const { errors: errorObjects } = await mutate({
          mutation: sendCoins,
          variables: {
            recipientCommunityIdentifier: homeCom.communityUuid,
            recipientIdentifier: 'peter@lustig.de',
            amount: 100,
            memo: 'test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test t',
          },
        })
        expect(errorObjects).toMatchObject([
          {
            message: 'Argument Validation Error',
            extensions: {
              exception: {
                validationErrors: [
                  {
                    property: 'memo',
                    constraints: {
                      maxLength: 'memo must be shorter than or equal to 255 characters',
                    },
                  },
                ],
              },
            },
          },
        ])
      })
    })

    describe('user has not enough GDD', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'peter@lustig.de',
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
        const { errors: errorObjects } = await mutate({
          mutation: sendCoins,
          variables: {
            recipientCommunityIdentifier: homeCom.communityUuid,
            recipientIdentifier: 'peter@lustig.de',
            amount: -50,
            memo: 'testing negative',
          },
        })
        expect(errorObjects).toMatchObject([
          {
            message: 'Argument Validation Error',
            extensions: {
              exception: {
                validationErrors: [
                  {
                    property: 'amount',
                    constraints: {
                      isPositiveDecimal: 'The amount must be a positive value amount',
                    },
                  },
                ],
              },
            },
          },
        ])
      })
    })

    describe('good transaction', () => {
      it('sends the coins', async () => {
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'peter@lustig.de',
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
          where: {
            userId: user[1].id,
            memo: 'unrepeatable memo',
          },
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
          where: {
            userId: user[0].id,
            memo: 'unrepeatable memo',
          },
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

      describe('sendTransactionsToDltConnector', () => {
        let transaction: Transaction[]
        let dltTransactions: DltTransaction[]
        beforeAll(async () => {
          // Find the previous created transactions of sendCoin mutation
          transaction = await Transaction.find({
            where: { memo: 'unrepeatable memo' },
            order: { balanceDate: 'ASC', id: 'ASC' },
          })

          // and read aslong as all async created dlt-transactions are finished
          do {
            dltTransactions = await DltTransaction.find({
              where: { transactionId: In([transaction[0].id, transaction[1].id]) },
              // relations: ['transaction'],
              // order: { createdAt: 'ASC', id: 'ASC' },
            })
          } while (transaction.length > dltTransactions.length)
        })

        it('has wait till sendTransactionsToDltConnector created all dlt-transactions', () => {
          expect(logger.info).toBeCalledWith('sendTransactionsToDltConnector...')

          expect(dltTransactions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(Number),
                transactionId: transaction[0].id,
                messageId: null,
                verified: false,
                createdAt: expect.any(Date),
                verifiedAt: null,
              }),
              expect.objectContaining({
                id: expect.any(Number),
                transactionId: transaction[1].id,
                messageId: null,
                verified: false,
                createdAt: expect.any(Date),
                verifiedAt: null,
              }),
            ]),
          )
        })
      })
    })

    describe('send coins via gradido ID', () => {
      it('sends the coins', async () => {
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: peter?.gradidoID,
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
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'bob',
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
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'peter@lustig.de',
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
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'peter@lustig.de',
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
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'peter@lustig.de',
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
              recipientCommunityIdentifier: homeCom.communityUuid,
              recipientIdentifier: 'peter@lustig.de',
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
