import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { CONFIG as CORE_CONFIG } from 'core'
import {
  AppDatabase,
  Community as DbCommunity,
  Event as DbEvent,
  FederatedCommunity as DbFederatedCommunity,
  DltTransaction,
  Transaction,
  User,
} from 'database'
import { GraphQLError } from 'graphql'
import { DataSource, In } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
// import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { EventType } from '@/event/Events'
// import { V1_0_SendCoinsClient } from 'core'
// import { SendCoinsArgs } from 'core'
// import { SendCoinsResult } from 'core'
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

jest.mock('@/password/EncryptorUtils')

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
CONFIG.DLT_ACTIVE = false
CORE_CONFIG.EMAIL = false

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let con: DataSource
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
  db: AppDatabase
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
  await con.destroy() // close()
  await testEnv.db.getRedisClient().quit()
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
    homeCom = DbCommunity.create()
    homeCom.communityUuid = uuidv4()
    homeCom.creationDate = new Date('2000-01-01')
    homeCom.description = 'homeCom description'
    homeCom.foreign = false
    homeCom.name = 'homeCom name'
    homeCom.privateKey = Buffer.from('homeCom privateKey')
    homeCom.publicKey = Buffer.from('homeCom publicKey')
    homeCom.url = 'homeCom url'
    homeCom = await DbCommunity.save(homeCom)

    foreignCom = DbCommunity.create()
    foreignCom.communityUuid = uuidv4()
    foreignCom.creationDate = new Date('2000-06-06')
    foreignCom.description = 'foreignCom description'
    foreignCom.foreign = true
    foreignCom.name = 'foreignCom name'
    foreignCom.privateKey = Buffer.from('foreignCom privateKey')
    foreignCom.publicKey = Buffer.from('foreignCom publicKey')
    foreignCom.url = 'foreignCom_url'
    foreignCom.authenticatedAt = new Date('2000-06-12')
    foreignCom = await DbCommunity.save(foreignCom)

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
            recipientCommunityIdentifier: homeCom.communityUuid,
            recipientIdentifier: 'wrong@email.com',
            amount: 100,
            memo: 'test test',
          },
        }),
      ).toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('The recipient user was not found')],
        }),
      )
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
            errors: [new GraphQLError('The recipient user was not found')],
          }),
        )
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
            errors: [new GraphQLError('The recipient user was not found')],
          }),
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
            memo: 'test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test',
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
                      maxLength: 'memo must be shorter than or equal to 512 characters',
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
        variables: { amount: 1000, memo: 'testing', contributionDate: new Date().toISOString() },
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
        // first set alias to null, because updating alias isn't allowed
        await User.update({ alias: 'MeisterBob' }, { alias: () => 'NULL' })
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
    /*
    describe.skip('X-Com send coins via gradido ID', () => {
      beforeAll(async () => {
        CONFIG.FEDERATION_XCOM_SENDCOINS_ENABLED = true
        fedForeignCom = DbFederatedCommunity.create()
        fedForeignCom.apiVersion = '1_0'
        fedForeignCom.foreign = true
        fedForeignCom.publicKey = Buffer.from('foreignCom publicKey')
        fedForeignCom.endPoint = 'http://foreignCom_url/api'
        fedForeignCom.lastAnnouncedAt = new Date('2000-06-09')
        fedForeignCom.verifiedAt = new Date('2000-06-10')
        fedForeignCom = await DbFederatedCommunity.save(fedForeignCom)

        jest
          .spyOn(SendCoinsClient.prototype, 'voteForSendCoins')
          .mockImplementation(async (args: SendCoinsArgs): Promise<SendCoinsResult> => {
            logger.debug('mock of voteForSendCoins...', args)
            return Promise.resolve({
              vote: true,
              recipFirstName: peter.firstName,
              recipLastName: peter.lastName,
              recipGradidoID: args.recipientUserIdentifier,
              recipAlias: peter.alias,
            })
          })

        jest
          .spyOn(SendCoinsClient.prototype, 'settleSendCoins')
          .mockImplementation(async (args: SendCoinsArgs): Promise<boolean> => {
            logger.debug('mock of settleSendCoins...', args)
            return Promise.resolve(true)
          })

        await mutate({
          mutation: login,
          variables: bobData,
        })
      })

      afterAll(() => {
        jest.clearAllMocks()
      })

      it('sends the coins', async () => {
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              recipientCommunityIdentifier: foreignCom.communityUuid,
              recipientIdentifier: peter?.gradidoID,
              amount: 10,
              memo: 'x-com send via gradido ID',
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
*/
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
