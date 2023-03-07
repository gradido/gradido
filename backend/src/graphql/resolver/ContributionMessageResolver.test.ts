/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { logger, i18n as localization } from '@test/testSetup'
import { GraphQLError } from 'graphql'
import {
  adminCreateContributionMessage,
  createContribution,
  createContributionMessage,
  login,
} from '@/seeds/graphql/mutations'
import { listContributionMessages } from '@/seeds/graphql/queries'
import { userFactory } from '@/seeds/factory/user'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { sendAddedContributionMessageEmail } from '@/emails/sendEmailVariants'
import { EventType } from '@/event/Event'
import { Event as DbEvent } from '@entity/Event'

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

let mutate: any, con: any
let testEnv: any
let result: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  mutate = testEnv.mutate
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
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
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        result = await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test env contribution',
            creationDate: new Date().toString(),
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

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith(
            'ContributionMessage was not sent successfully: Error: Contribution not found',
            new Error('Contribution not found'),
          )
        })

        it('throws error when contribution.userId equals user.id', async () => {
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
              creationDate: new Date().toString(),
            },
          })
          await expect(
            mutate({
              mutation: adminCreateContributionMessage,
              variables: {
                contributionId: result2.data.createContribution.id,
                message: 'Test',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'ContributionMessage was not sent successfully: Error: Admin can not answer on his own contribution',
                ),
              ],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith(
            'ContributionMessage was not sent successfully: Error: Admin can not answer on his own contribution',
            new Error('Admin can not answer on his own contribution'),
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

        it('calls sendAddedContributionMessageEmail', async () => {
          expect(sendAddedContributionMessageEmail).toBeCalledWith({
            firstName: 'Bibi',
            lastName: 'Bloxberg',
            email: 'bibi@bloxberg.de',
            language: 'de',
            senderFirstName: 'Peter',
            senderLastName: 'Lustig',
            contributionMemo: 'Test env contribution',
          })
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

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith(
            'ContributionMessage was not sent successfully: Error: Contribution not found',
            new Error('Contribution not found'),
          )
        })

        it('throws error when other user tries to send createContributionMessage', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
          await expect(
            mutate({
              mutation: createContributionMessage,
              variables: {
                contributionId: result.data.createContribution.id,
                message: 'Test',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'ContributionMessage was not sent successfully: Error: Can not send message to contribution of another user',
                ),
              ],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith(
            'ContributionMessage was not sent successfully: Error: Can not send message to contribution of another user',
            new Error('Can not send message to contribution of another user'),
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

      it('returns a list of contributionmessages', async () => {
        await expect(
          mutate({
            mutation: listContributionMessages,
            variables: { contributionId: result.data.createContribution.id },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listContributionMessages: {
                count: 2,
                messages: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'Admin Test',
                    type: 'DIALOG',
                    userFirstName: 'Peter',
                    userLastName: 'Lustig',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    message: 'User Test',
                    type: 'DIALOG',
                    userFirstName: 'Bibi',
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
})
