import { ContributionStatus } from '@enum/ContributionStatus'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { i18n as localization } from '@test/testSetup'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { Contribution as DbContribution, Event as DbEvent } from 'database'
import { GraphQLError } from 'graphql'
import { DataSource } from 'typeorm'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { sendAddedContributionMessageEmail } from '@/emails/sendEmailVariants'
import { EventType } from '@/event/Events'
import { userFactory } from '@/seeds/factory/user'
import {
  adminCreateContributionMessage,
  createContribution,
  createContributionMessage,
  login,
} from '@/seeds/graphql/mutations'
import { adminListContributionMessages, listContributionMessages } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ContributionMessageResolver`,
)
const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)
const interactionLogger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.interactions.updateUnconfirmedContribution`,
)

jest.mock('@/password/EncryptorUtils')
jest.mock('@/emails/sendEmailVariants', () => {
  const originalModule = jest.requireActual('@/emails/sendEmailVariants')
  return {
    __esModule: true,
    ...originalModule,
    sendAddedContributionMessageEmail: jest.fn((a) =>
      originalModule.sendAddedContributionMessageEmail(a),
    ),
  }
})

let mutate: ApolloServerTestClient['mutate']
let con: DataSource
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
}
let result: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  mutate = testEnv.mutate
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.destroy()
})

describe('ContributionMessageResolver', () => {
  describe('adminCreateContributionMessage', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: adminCreateContributionMessage,
            variables: { contributionId: 1, message: 'This is a test message' },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        await userFactory(testEnv, peterLustig)
        await userFactory(testEnv, bobBaumeister)
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        result = await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test env contribution',
            contributionDate: new Date().toString(),
          },
        })
        await mutate({
          mutation: login,
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('input not valid', () => {
        it('throws error when contribution does not exist', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: adminCreateContributionMessage,
              variables: {
                contributionId: -1,
                message: 'Test',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'ContributionMessage was not sent successfully: Error: Contribution not found',
                ),
              ],
            }),
          )
        })

        it('logs the error "ContributionMessage was not sent successfully: Error: Contribution not found"', () => {
          expect(logErrorLogger.error).toBeCalledWith(
            'ContributionMessage was not sent successfully: Error: Contribution not found',
            new Error('Contribution not found'),
          )
        })

        it('treat the logged-in user as a normal user, not as a moderator or admin if contribution.userId equals user.id', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
          const result2 = await mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test env contribution',
              contributionDate: new Date().toString(),
            },
          })
          const mutationResult = await mutate({
            mutation: adminCreateContributionMessage,
            variables: {
              contributionId: result2.data.createContribution.id,
              message: 'Test',
            },
          })
          expect(interactionLogger.debug).toBeCalledWith(
            'use UnconfirmedContributionUserAddMessageRole',
          )
          expect(mutationResult).toEqual(
            expect.objectContaining({
              data: {
                adminCreateContributionMessage: expect.objectContaining({
                  id: expect.any(Number),
                  message: 'Test',
                  type: 'DIALOG',
                  userFirstName: 'Peter',
                  userLastName: 'Lustig',
                }),
              },
            }),
          )
        })
      })

      describe('contribution message type MODERATOR', () => {
        beforeAll(() => {
          jest.clearAllMocks()
        })

        it('creates ContributionMessage', async () => {
          await expect(
            mutate({
              mutation: adminCreateContributionMessage,
              variables: {
                contributionId: result.data.createContribution.id,
                message: 'Internal moderator communication',
                messageType: 'MODERATOR',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                adminCreateContributionMessage: expect.objectContaining({
                  id: expect.any(Number),
                  message: 'Internal moderator communication',
                  type: 'MODERATOR',
                  userFirstName: 'Peter',
                  userLastName: 'Lustig',
                }),
              },
            }),
          )
        })

        it('does not call sendAddedContributionMessageEmail', () => {
          expect(sendAddedContributionMessageEmail).not.toBeCalled()
        })

        it('does not change contribution status', async () => {
          await expect(DbContribution.find()).resolves.toContainEqual(
            expect.objectContaining({
              id: result.data.createContribution.id,
              contributionStatus: ContributionStatus.PENDING,
            }),
          )
        })
      })

      describe('valid input', () => {
        it('creates ContributionMessage', async () => {
          await expect(
            mutate({
              mutation: adminCreateContributionMessage,
              variables: {
                contributionId: result.data.createContribution.id,
                message: 'Admin Test',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                adminCreateContributionMessage: expect.objectContaining({
                  id: expect.any(Number),
                  message: 'Admin Test',
                  type: 'DIALOG',
                  userFirstName: 'Peter',
                  userLastName: 'Lustig',
                }),
              },
            }),
          )
        })

        it('calls sendAddedContributionMessageEmail', () => {
          expect(sendAddedContributionMessageEmail).toBeCalledWith({
            firstName: 'Bibi',
            lastName: 'Bloxberg',
            email: 'bibi@bloxberg.de',
            language: 'de',
            message: 'Admin Test',
            senderFirstName: 'Peter',
            senderLastName: 'Lustig',
            contributionMemo: 'Test env contribution',
            contributionFrontendLink: `http://localhost/contributions/own-contributions/1#contributionListItem-${result.data.createContribution.id}`,
          })
        })

        it('changes contribution status', async () => {
          await expect(DbContribution.find()).resolves.toContainEqual(
            expect.objectContaining({
              id: result.data.createContribution.id,
              contributionStatus: ContributionStatus.IN_PROGRESS,
            }),
          )
        })

        it('stores the ADMIN_CONTRIBUTION_MESSAGE_CREATE event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.ADMIN_CONTRIBUTION_MESSAGE_CREATE,
              affectedUserId: expect.any(Number),
              actingUserId: expect.any(Number),
              involvedContributionId: result.data.createContribution.id,
              involvedContributionMessageId: expect.any(Number),
            }),
          )
        })
      })
    })
  })

  describe('createContributionMessage', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: createContributionMessage,
            variables: { contributionId: 1, message: 'This is a test message' },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('input not valid', () => {
        it('throws error when contribution does not exist', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionMessage,
              variables: {
                contributionId: -1,
                message: 'Test',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'ContributionMessage was not sent successfully: Error: Contribution not found',
                ),
              ],
            }),
          )
        })

        it('logs the error "ContributionMessage was not sent successfully: Error: Contribution not found"', () => {
          expect(logErrorLogger.error).toBeCalledWith(
            'ContributionMessage was not sent successfully: Error: Contribution not found',
            new Error('Contribution not found'),
          )
        })

        it('other user tries to send createContributionMessage but is also moderator or admin so it is allowed', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })

          const mutationResult = await mutate({
            mutation: createContributionMessage,
            variables: {
              contributionId: result.data.createContribution.id,
              message: 'Test',
            },
          })

          expect(interactionLogger.debug).toBeCalledWith(
            'use UnconfirmedContributionAdminAddMessageRole',
          )

          expect(mutationResult).toEqual(
            expect.objectContaining({
              data: {
                createContributionMessage: expect.objectContaining({
                  id: expect.any(Number),
                  message: 'Test',
                  type: 'DIALOG',
                  userFirstName: 'Peter',
                  userLastName: 'Lustig',
                }),
              },
            }),
          )
        })

        it('throws error when other user tries to send createContributionMessage', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
          })
          const mutationResult = await mutate({
            mutation: createContributionMessage,
            variables: {
              contributionId: result.data.createContribution.id,
              message: 'Test',
            },
          })
          expect(interactionLogger.debug).toBeCalledWith(
            'use UnconfirmedContributionAdminAddMessageRole',
          )

          expect(mutationResult).toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'ContributionMessage was not sent successfully: Error: missing right ADMIN_CREATE_CONTRIBUTION_MESSAGE for user',
                ),
              ],
            }),
          )
        })

        it('logs the error "ContributionMessage was not sent successfully: Error: missing right ADMIN_CREATE_CONTRIBUTION_MESSAGE for user"', () => {
          expect(logErrorLogger.error).toHaveBeenNthCalledWith(
            1,
            'missing right ADMIN_CREATE_CONTRIBUTION_MESSAGE for user',
            expect.any(Number),
          )
          expect(logErrorLogger.error).toHaveBeenNthCalledWith(
            2,
            'ContributionMessage was not sent successfully: Error: missing right ADMIN_CREATE_CONTRIBUTION_MESSAGE for user',
            new Error('missing right ADMIN_CREATE_CONTRIBUTION_MESSAGE for user'),
          )
        })
      })

      describe('valid input', () => {
        beforeAll(async () => {
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        it('creates ContributionMessage', async () => {
          await expect(
            mutate({
              mutation: createContributionMessage,
              variables: {
                contributionId: result.data.createContribution.id,
                message: 'User Test',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                createContributionMessage: expect.objectContaining({
                  id: expect.any(Number),
                  message: 'User Test',
                  type: 'DIALOG',
                  userFirstName: 'Bibi',
                  userLastName: 'Bloxberg',
                }),
              },
            }),
          )
        })

        it('stores the CONTRIBUTION_MESSAGE_CREATE event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.CONTRIBUTION_MESSAGE_CREATE,
              affectedUserId: expect.any(Number),
              actingUserId: expect.any(Number),
              involvedContributionId: result.data.createContribution.id,
              involvedContributionMessageId: expect.any(Number),
            }),
          )
        })
      })
    })
  })

  describe('listContributionMessages', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: listContributionMessages,
            variables: { contributionId: 1 },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      it('returns a list of contributionmessages without type MODERATOR', async () => {
        await expect(
          mutate({
            mutation: listContributionMessages,
            variables: { contributionId: result.data.createContribution.id },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listContributionMessages: {
                count: 3,
                messages: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'Admin Test',
                    type: 'DIALOG',
                    userFirstName: 'Peter',
                    userId: expect.any(Number),
                    userLastName: 'Lustig',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'Test',
                    type: 'DIALOG',
                    userFirstName: 'Peter',
                    userId: expect.any(Number),
                    userLastName: 'Lustig',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'User Test',
                    type: 'DIALOG',
                    userFirstName: 'Bibi',
                    userId: expect.any(Number),
                    userLastName: 'Bloxberg',
                  }),
                ]),
              },
            },
          }),
        )
      })
    })
  })

  describe('adminListContributionMessages', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: adminListContributionMessages,
            variables: { contributionId: 1 },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated as user', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: adminListContributionMessages,
            variables: { contributionId: 1 },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated as admin', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      it('returns a list of contributionmessages with type MODERATOR', async () => {
        await expect(
          mutate({
            mutation: adminListContributionMessages,
            variables: { contributionId: result.data.createContribution.id },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              adminListContributionMessages: {
                count: 4,
                messages: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'Admin Test',
                    type: 'DIALOG',
                    userFirstName: 'Peter',
                    userId: expect.any(Number),
                    userLastName: 'Lustig',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'Test',
                    type: 'DIALOG',
                    userFirstName: 'Peter',
                    userId: expect.any(Number),
                    userLastName: 'Lustig',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'User Test',
                    type: 'DIALOG',
                    userFirstName: 'Bibi',
                    userId: expect.any(Number),
                    userLastName: 'Bloxberg',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'Internal moderator communication',
                    type: 'MODERATOR',
                    userFirstName: 'Peter',
                    userId: expect.any(Number),
                    userLastName: 'Lustig',
                  }),
                ]),
              },
            },
          }),
        )
      })
    })
  })
})
