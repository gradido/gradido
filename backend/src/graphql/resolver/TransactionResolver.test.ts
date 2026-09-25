import { randomBytes } from 'node:crypto'
import { cleanDB, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { CONFIG as CORE_CONFIG, sendCustomEmail } from 'core'
import {
  AppDatabase,
  chatConversationMembersTable,
  chatConversationsTable,
  chatMessagesTable,
  Community as DbCommunity,
  Event as DbEvent,
  FederatedCommunity as DbFederatedCommunity,
  dbUpsertForeignMemberAvatarDates,
  EventType,
  foreignReceive,
  Transaction,
  User,
} from 'database'
import { GraphQLError } from 'graphql'
import { GraphQLClient } from 'graphql-request'
import {
  CommandJwtPayloadType,
  createKeyPair,
  GradidoUnit,
  uuidv4Schema,
  verifyAndDecrypt,
} from 'shared'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
// import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
// import { V1_0_SendCoinsClient } from 'core'
// import { SendCoinsArgs } from 'core'
// import { SendCoinsResult } from 'core'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmContribution,
  createContribution,
  login,
  removeUserAvatar,
  sendCoins,
  sendEmail,
  setChatConversationMuted,
  setUserAvatar,
  updateUserInfos,
} from '@/seeds/graphql/mutations'
import { transactionsQuery } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'

jest.mock('@/password/EncryptorUtils')
// The mail stays the real function -- with mail switched off it sends nothing -- and is
// watched, to see whether a message goes out as one.
jest.mock('core', () => {
  const originalModule = jest.requireActual('core')
  return {
    __esModule: true,
    ...originalModule,
    sendCustomEmail: jest.fn(originalModule.sendCustomEmail),
  }
})

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
CONFIG.DLT_ACTIVE = false
CORE_CONFIG.EMAIL = false

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  query = testEnv.query
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await testEnv.db.destroy()
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
            amount: '100',
            memo: 'test test',
          },
        }),
      ).toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('The recipient user was not found: wrong@email.com')],
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
              amount: '100',
              memo: 'test test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('The recipient user was not found: stephen@hawking.uk')],
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
              amount: '100',
              memo: 'test test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('The recipient user was not found: garrick@ollivander.com')],
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
              amount: '100',
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
            amount: '100',
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
            amount: '100',
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
              amount: '100',
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
        variables: { amount: '1000', memo: 'testing', contributionDate: new Date().toISOString() },
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
            amount: '-50',
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
                      isPositiveGradidoUnit: 'The amount must be a positive value amount',
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
              amount: '50',
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
              amount: '10',
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
              amount: '6.66',
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
                    amount: '-6.66',
                    // The real-name guard (NU-019) seen from the MODERATION side: peter
                    // is the seeded administrator, so he is one of the two parties the
                    // guard lets through and bob's row carries the real name. The row
                    // still leads with the alias. What an ordinary member gets instead
                    // is pinned in UserRealNameGuard.test.ts, which covers all six cases.
                    linkedUser: expect.objectContaining({
                      firstName: 'Bob',
                      gradidoID: bob?.gradidoID,
                      lastName: 'der Baumeister',
                      alias: 'bob',
                    }),
                    memo: 'send via alias',
                    typeId: 'SEND',
                  }),
                  expect.objectContaining({
                    amount: '10',
                    // The real-name guard (NU-019) seen from the MODERATION side: peter
                    // is the seeded administrator, so he is one of the two parties the
                    // guard lets through and bob's row carries the real name. The row
                    // still leads with the alias. What an ordinary member gets instead
                    // is pinned in UserRealNameGuard.test.ts, which covers all six cases.
                    linkedUser: expect.objectContaining({
                      firstName: 'Bob',
                      gradidoID: bob?.gradidoID,
                      lastName: 'der Baumeister',
                      alias: 'bob',
                    }),
                    memo: 'send via gradido ID',
                    typeId: 'RECEIVE',
                  }),
                  expect.objectContaining({
                    amount: '50',
                    // The real-name guard (NU-019) seen from the MODERATION side: peter
                    // is the seeded administrator, so he is one of the two parties the
                    // guard lets through and bob's row carries the real name. The row
                    // still leads with the alias. What an ordinary member gets instead
                    // is pinned in UserRealNameGuard.test.ts, which covers all six cases.
                    linkedUser: expect.objectContaining({
                      firstName: 'Bob',
                      gradidoID: bob?.gradidoID,
                      lastName: 'der Baumeister',
                      alias: 'bob',
                    }),
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

      /**
       * ⛔ The date the booking list carries for each counterparty, at the position that
       * actually carries it. The query behind it is covered in
       * database/src/queries/userAvatars.test.ts, and memberAvatars is covered in
       * UserResolver.test.ts -- but the batch fill in transactionList had nothing at all.
       * Delete the whole loop, or invert its `?? null`, and this file did not notice.
       *
       * ★ And it is not a cosmetic field. This null is the ONLY thing that tells every
       * other member's device to drop a picture it is still holding: the wallet reads a
       * missing date as "forget her", so a member who turns the switch off reaches those
       * devices through this value or not at all (AS-003, AS-009).
       */
      describe("the counterparty's picture date", () => {
        // A minimal but real JPEG head -- the resolver checks the magic bytes, so anything
        // else would be rejected for the right reason and prove nothing.
        const JPEG_BASE64 = Buffer.from([
          0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9,
        ]).toString('base64')
        const JPEG_FULL_BASE64 = Buffer.from([
          0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78, 0x69, 0xff, 0xd9,
        ]).toString('base64')

        const bobsRow = async () => {
          const res: any = await query({ query: transactionsQuery })
          return res.data.transactionList.transactions.find(
            (transaction: any) => transaction.linkedUser?.gradidoID === bob?.gradidoID,
          )
        }

        beforeAll(async () => {
          await mutate({ mutation: login, variables: bobData })
          await mutate({
            mutation: setUserAvatar,
            variables: { avatarSmall: JPEG_BASE64, avatarFull: JPEG_FULL_BASE64 },
          })
          await mutate({ mutation: login, variables: peterData })
        })

        afterAll(async () => {
          await mutate({ mutation: login, variables: bobData })
          await mutate({ mutation: removeUserAvatar })
          await mutate({ mutation: login, variables: peterData })
        })

        it('reaches peter for a member who shows their picture', async () => {
          const row = await bobsRow()
          expect(row).toBeDefined()
          expect(row.linkedUser.avatarUpdatedAt).not.toBeNull()
        })

        // The same row, one switch later. Only the setting differs, so this cannot pass for
        // some unrelated reason -- and the null it asserts is the withdrawal itself.
        it('stops reaching him the moment bob switches it off', async () => {
          await mutate({ mutation: login, variables: bobData })
          await mutate({
            mutation: updateUserInfos,
            variables: { avatarVisibleToMembers: false },
          })
          await mutate({ mutation: login, variables: peterData })

          const row = await bobsRow()
          expect(row.linkedUser.avatarUpdatedAt).toBeNull()

          await mutate({ mutation: login, variables: bobData })
          await mutate({
            mutation: updateUserInfos,
            variables: { avatarVisibleToMembers: true },
          })
          await mutate({ mutation: login, variables: peterData })
        })

        /**
         * ★ A member of ANOTHER community carries the date their community last reported
         * (AS-019), as refreshForeignMemberAvatarDates stored it. Without it the wallet never
         * asks for their face, and with a stale one it would keep a withdrawn face.
         *
         * Two shapes of booking reach the list by two different paths, and both are here: one
         * that names the member only by the pair, and one that carries the id of the `users`
         * row the federation stored for them.
         *
         * Bibi's own bookings, so peter's list above stays exactly as it was.
         */
        describe('for a member of another community', () => {
          const ANNA = uuidv4()
          const OTTO = uuidv4()
          const NOBODY = uuidv4()
          // A third community with a member under ANNA's very gradido id: another person.
          const FARTHER = uuidv4()
          const ANNAS_PICTURE = new Date('2026-09-14T16:58:37.124Z')
          const OTTOS_PICTURE = new Date('2026-09-15T08:01:02.345Z')
          const NAMESAKES_PICTURE = new Date('2026-09-15T09:30:00.678Z')
          let far: string
          let bookings: any[]

          const rowWith = (communityUuid: string, gradidoID: string) =>
            bookings.find(
              (booking) =>
                booking.linkedUser?.communityUuid === communityUuid &&
                booking.linkedUser?.gradidoID === gradidoID,
            )

          beforeAll(async () => {
            const bibi = await userFactory(testEnv, bibiBloxberg)
            far = foreignCom.communityUuid as string
            const ottosRow = await User.create({
              foreign: true,
              communityUuid: far,
              gradidoID: OTTO,
              alias: 'otto',
            }).save()
            // Oldest first: a seeded booking computes its decay from the one before.
            const now = Date.now()
            await foreignReceive(
              bibi,
              { communityUuid: far, gradidoID: ANNA, name: 'anna' },
              new Date(now - 3000),
            )
            await foreignReceive(
              bibi,
              { communityUuid: far, gradidoID: OTTO, name: 'otto', linkedUserId: ottosRow.id },
              new Date(now - 2000),
            )
            await foreignReceive(
              bibi,
              { communityUuid: far, gradidoID: NOBODY, name: 'nobody' },
              new Date(now - 1000),
            )
            await foreignReceive(
              bibi,
              { communityUuid: FARTHER, gradidoID: ANNA, name: 'namesake' },
              new Date(now - 500),
            )
            await dbUpsertForeignMemberAvatarDates([
              {
                communityUuid: far,
                gradidoId: ANNA,
                avatarUpdatedAt: ANNAS_PICTURE,
                checkedAt: new Date(),
              },
              {
                communityUuid: far,
                gradidoId: OTTO,
                avatarUpdatedAt: OTTOS_PICTURE,
                checkedAt: new Date(),
              },
              {
                communityUuid: FARTHER,
                gradidoId: ANNA,
                avatarUpdatedAt: NAMESAKES_PICTURE,
                checkedAt: new Date(),
              },
            ])

            await mutate({
              mutation: login,
              variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
            })
            const res: any = await query({ query: transactionsQuery })
            if (res.errors) {
              throw new Error(`the booking list failed: ${JSON.stringify(res.errors)}`)
            }
            bookings = res.data.transactionList.transactions
          })

          afterAll(async () => {
            await mutate({ mutation: login, variables: peterData })
          })

          it('carries the date their community reported for a member named only by the pair', () => {
            expect(rowWith(far, ANNA).linkedUser.avatarUpdatedAt).toBe(ANNAS_PICTURE.toISOString())
          })

          it('carries it too when the booking names the row the federation stored for them', () => {
            expect(rowWith(far, OTTO).linkedUser.avatarUpdatedAt).toBe(OTTOS_PICTURE.toISOString())
          })

          it('carries null for a member their community reported no date for', () => {
            // The fixture proves itself: the row is there, only its date is not.
            expect(rowWith(far, NOBODY)).toBeDefined()
            expect(rowWith(far, NOBODY).linkedUser.avatarUpdatedAt).toBeNull()
          })

          /**
           * ⛔ The same gradido id in two communities is two people. Each booking row names its
           * own member -- community, id and picture date -- and not whichever of the two the
           * page happened to resolve first.
           */
          it('tells two members with the same gradido id in two communities apart', () => {
            const namesakes = bookings
              .filter((booking) => booking.linkedUser?.gradidoID === ANNA)
              .map((booking) => [
                booking.linkedUser.communityUuid,
                booking.linkedUser.avatarUpdatedAt,
              ])
            expect(namesakes).toHaveLength(2)
            expect(namesakes).toContainEqual([far, ANNAS_PICTURE.toISOString()])
            expect(namesakes).toContainEqual([FARTHER, NAMESAKES_PICTURE.toISOString()])
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
              amount: '10',
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
              amount: '20',
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
              amount: '30',
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
              amount: '40',
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
                balance: '0',
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

/**
 * The chat's first step: every message that goes out through "send e-mail" is filed as well.
 * Nothing reads the rows yet, so these cases read the tables themselves.
 */
describe('sendEmail', () => {
  const SUBJECT = 'About Saturday'
  const MEMO = 'Shall we meet at ten?\nAt the market.'

  const drizzle = () => AppDatabase.getInstance().getDrizzleDataSource()
  const conversations = () => drizzle().select().from(chatConversationsTable)
  const members = () => drizzle().select().from(chatConversationMembersTable)
  // In the order of arrival: the id is the only order a conversation has.
  const messages = async () =>
    (await drizzle().select().from(chatMessagesTable)).sort((a, b) => a.id - b.id)
  const pairOf = (member: User) => `${member.communityUuid}/${member.gradidoID}`
  const loginAs = (email: string) =>
    mutate({ mutation: login, variables: { email, password: 'Aa12345_' } })

  let bobMember: User
  let peterMember: User

  beforeAll(async () => {
    await cleanDB()
    bobMember = await userFactory(testEnv, bobBaumeister)
    peterMember = await userFactory(testEnv, peterLustig)
  })

  afterAll(async () => {
    await cleanDB()
  })

  describe('within the community', () => {
    it('files the message once, in a conversation of the two', async () => {
      await loginAs('bob@baumeister.de')
      await expect(
        mutate({
          mutation: sendEmail,
          variables: {
            recipientCommunityIdentifier: bobMember.communityUuid,
            recipientIdentifier: peterMember.gradidoID,
            subject: SUBJECT,
            memo: MEMO,
          },
        }),
      ).resolves.toMatchObject({ data: { sendEmail: true }, errors: undefined })

      const [conversation, ...otherConversations] = await conversations()
      expect(otherConversations).toEqual([])
      expect(conversation).toMatchObject({
        kind: 'direct',
        createdByCommunityUuid: bobMember.communityUuid,
        createdByGradidoId: bobMember.gradidoID,
      })
      expect((await members()).map((m) => `${m.communityUuid}/${m.gradidoId}`).sort()).toEqual(
        [pairOf(bobMember), pairOf(peterMember)].sort(),
      )

      const [message, ...otherMessages] = await messages()
      expect(otherMessages).toEqual([])
      expect(message).toMatchObject({
        conversationId: conversation.id,
        senderCommunityUuid: bobMember.communityUuid,
        senderGradidoId: bobMember.gradidoID,
        subject: SUBJECT,
        body: MEMO,
        notify: 'email',
        deliveryState: 'delivered',
        lastAttemptAt: null,
      })
      expect(uuidv4Schema.safeParse(message.messageUuid).success).toBe(true)
    })

    it('files the answer, and the next message, in the same conversation', async () => {
      await loginAs('peter@lustig.de')
      // Named by e-mail address this time: the conversation is the pair, not the name used.
      await expect(
        mutate({
          mutation: sendEmail,
          variables: {
            recipientCommunityIdentifier: peterMember.communityUuid,
            recipientIdentifier: 'bob@baumeister.de',
            subject: '',
            memo: 'Ten is fine.',
          },
        }),
      ).resolves.toMatchObject({ data: { sendEmail: true }, errors: undefined })
      await loginAs('bob@baumeister.de')
      await expect(
        mutate({
          mutation: sendEmail,
          variables: {
            recipientCommunityIdentifier: bobMember.communityUuid,
            recipientIdentifier: peterMember.gradidoID,
            subject: SUBJECT,
            memo: 'See you.',
          },
        }),
      ).resolves.toMatchObject({ data: { sendEmail: true }, errors: undefined })

      const [conversation, ...otherConversations] = await conversations()
      expect(otherConversations).toEqual([])
      expect(await members()).toHaveLength(2)
      const filed = await messages()
      expect(filed.map((m) => [m.conversationId, m.senderGradidoId, m.body])).toEqual([
        [conversation.id, bobMember.gradidoID, MEMO],
        [conversation.id, peterMember.gradidoID, 'Ten is fine.'],
        [conversation.id, bobMember.gradidoID, 'See you.'],
      ])
      // A message without a subject has none, not an empty one.
      expect(filed[1].subject).toBeNull()
    })

    it('files nothing for a message to oneself', async () => {
      await loginAs('bob@baumeister.de')
      const before = await messages()

      const result = await mutate({
        mutation: sendEmail,
        variables: {
          recipientCommunityIdentifier: bobMember.communityUuid,
          recipientIdentifier: bobMember.gradidoID,
          subject: SUBJECT,
          memo: MEMO,
        },
      })

      expect(result.errors).toEqual([new GraphQLError('You cannot send an email to yourself')])
      expect(await messages()).toEqual(before)
    })

    // E-024: mute beats the tick -- for the form as well, as it does across the border, where
    // the receiving server decides. The one change to sendEmail, and the sender is not told.
    it('files the message but mails nothing to a recipient who muted the conversation, and answers as ever', async () => {
      const mailed = sendCustomEmail as jest.Mock
      const writeToPeter = (memo: string) =>
        mutate({
          mutation: sendEmail,
          variables: {
            recipientCommunityIdentifier: bobMember.communityUuid,
            recipientIdentifier: peterMember.gradidoID,
            subject: SUBJECT,
            memo,
          },
        })

      await loginAs('bob@baumeister.de')
      mailed.mockClear()
      await expect(writeToPeter('Before the quiet.')).resolves.toMatchObject({
        data: { sendEmail: true },
        errors: undefined,
      })
      expect(mailed.mock.calls.map(([mail]) => mail.email)).toEqual(['peter@lustig.de'])

      await loginAs('peter@lustig.de')
      await expect(
        mutate({
          mutation: setChatConversationMuted,
          variables: {
            ref: { communityUuid: bobMember.communityUuid, gradidoID: bobMember.gradidoID },
            muted: true,
          },
        }),
      ).resolves.toMatchObject({ data: { setChatConversationMuted: true }, errors: undefined })

      await loginAs('bob@baumeister.de')
      mailed.mockClear()
      await expect(writeToPeter('During the quiet.')).resolves.toMatchObject({
        data: { sendEmail: true },
        errors: undefined,
      })
      expect(mailed).not.toHaveBeenCalled()
      expect((await messages()).map((m) => m.body)).toContain('During the quiet.')
    })
  })

  /**
   * ⛔ The stand-in for the other community opens the command with ITS key, as the real one
   * would: the messageUuid is read out of the sealed payload, not taken from a spy on this
   * server's side of the seal.
   */
  describe('to a member of another community', () => {
    const peerUuid = uuidv4()
    const peerMember = uuidv4()

    let homeKeys: { publicKey: string; privateKey: string }
    let peerKeys: { publicKey: string; privateKey: string }
    let peer: DbCommunity
    let peerEntry: DbFederatedCommunity
    let rawRequest: jest.SpyInstance | undefined
    let commands: Record<string, unknown>[] = []
    // What this server had filed for each command while it was on its way.
    let inFlight: (string | undefined)[] = []

    /** The other community: opens each command with its key and answers as it is told. */
    const peerAnswers = (answer: { success: boolean; error?: string }) => {
      rawRequest = jest
        .spyOn(GraphQLClient.prototype, 'rawRequest')
        // CommandClient.sendCommand calls rawRequest(document, variables) -- two arguments,
        // not the options object the member-avatar client hands over.
        .mockImplementation((async (
          _document: unknown,
          variables: { args: { handshakeID: string; jwt: string } },
        ) => {
          const { args } = variables
          const command = (await verifyAndDecrypt(
            args.handshakeID,
            args.jwt,
            peerKeys.privateKey,
            homeKeys.publicKey,
          )) as CommandJwtPayloadType | null
          if (!command) {
            throw new Error('the command does not verify with the key of this community')
          }
          const sent = JSON.parse(command.commandArgs[0])
          commands.push(sent)
          inFlight.push(
            (await messages()).find((m) => m.messageUuid === sent.messageUuid)?.deliveryState,
          )
          return { data: { sendCommand: answer }, status: 200 }
        }) as any)
    }

    const sendToPeer = (recipientIdentifier: string, memo: string) =>
      mutate({
        mutation: sendEmail,
        variables: {
          recipientCommunityIdentifier: peerUuid,
          recipientIdentifier,
          subject: SUBJECT,
          memo,
        },
      })

    const filedWithBody = async (body: string) => (await messages()).filter((m) => m.body === body)

    beforeAll(async () => {
      homeKeys = await createKeyPair()
      peerKeys = await createKeyPair()
      await DbCommunity.update(
        { foreign: false },
        { publicJwtKey: homeKeys.publicKey, privateJwtKey: homeKeys.privateKey },
      )
      peer = await DbCommunity.create({
        foreign: true,
        url: 'http://chat-peer.invalid/api/',
        publicKey: randomBytes(32),
        communityUuid: peerUuid,
        authenticatedAt: new Date(),
        name: 'Chat peer',
        description: 'the other side of the border',
        creationDate: new Date(),
        publicJwtKey: peerKeys.publicKey,
      }).save()
      peerEntry = await DbFederatedCommunity.create({
        foreign: true,
        publicKey: peer.publicKey,
        apiVersion: '1_0',
        endPoint: 'http://chat-peer.invalid/api/',
      }).save()
      await loginAs('bob@baumeister.de')
    })

    beforeEach(() => {
      commands = []
      inFlight = []
    })

    afterEach(() => {
      rawRequest?.mockRestore()
      rawRequest = undefined
    })

    afterAll(async () => {
      await DbFederatedCommunity.delete({ id: peerEntry.id })
      await DbCommunity.delete({ id: peer.id })
    })

    it('files its own copy under the uuid the command carries, and marks it delivered', async () => {
      peerAnswers({ success: true })

      await expect(sendToPeer(peerMember, 'Across the border')).resolves.toMatchObject({
        data: { sendEmail: true },
        errors: undefined,
      })

      expect(commands).toEqual([
        {
          mailType: 'sendCustomEmail',
          senderComUuid: bobMember.communityUuid,
          senderGradidoId: bobMember.gradidoID,
          receiverComUuid: peerUuid,
          receiverGradidoId: peerMember,
          subject: SUBJECT,
          memo: 'Across the border',
          messageUuid: expect.any(String),
          // E-034: what the other server files bob with, if it does not know him yet.
          senderAlias: bobMember.alias,
        },
      ])
      const [ownCopy, ...more] = await filedWithBody('Across the border')
      expect(more).toEqual([])
      expect(ownCopy).toMatchObject({
        messageUuid: commands[0].messageUuid,
        senderCommunityUuid: bobMember.communityUuid,
        senderGradidoId: bobMember.gradidoID,
        subject: SUBJECT,
        notify: 'email',
        deliveryState: 'delivered',
      })
      expect(ownCopy.lastAttemptAt).toBeInstanceOf(Date)
      // The own copy comes first, as not yet delivered, and only the answer delivers it.
      expect(inFlight).toEqual(['pending'])
      const [conversation] = (await conversations()).filter((c) => c.id === ownCopy.conversationId)
      expect(conversation.directPairKey).toContain(`${peerUuid}/${peerMember}`)
    })

    it('marks its own copy failed when the other community refuses it, and throws as before', async () => {
      peerAnswers({ success: false, error: 'Recipient user not found' })

      const result = await sendToPeer(peerMember, 'Refused over there')

      expect(result.errors).toEqual([
        new GraphQLError('sendCommand failed with response error: Recipient user not found'),
      ])
      const [ownCopy] = await filedWithBody('Refused over there')
      expect(ownCopy.messageUuid).toBe(commands[0].messageUuid)
      expect(ownCopy.deliveryState).toBe('failed')
      expect(ownCopy.lastAttemptAt).toBeInstanceOf(Date)
      expect(inFlight).toEqual(['pending'])
    })

    // The other server looks a recipient up by gradido id and nothing else.
    it('files nothing for a recipient named otherwise, and still sends the command', async () => {
      peerAnswers({ success: false, error: 'Recipient user not found' })
      const before = await messages()

      const result = await sendToPeer('raeuber', 'Named by user name')

      expect(result.errors).toHaveLength(1)
      expect(commands).toHaveLength(1)
      expect(inFlight).toEqual([undefined])
      expect(await messages()).toEqual(before)
    })

    it('files nothing when the command cannot be sealed for the other community', async () => {
      await DbCommunity.update({ id: peer.id }, { publicJwtKey: null })
      try {
        peerAnswers({ success: true })
        const before = await messages()

        const result = await sendToPeer(peerMember, 'Never sealed')

        expect(result.errors).toHaveLength(1)
        expect(rawRequest).not.toHaveBeenCalled()
        expect(await messages()).toEqual(before)
      } finally {
        await DbCommunity.update({ id: peer.id }, { publicJwtKey: peerKeys.publicKey })
      }
    })
  })
})
