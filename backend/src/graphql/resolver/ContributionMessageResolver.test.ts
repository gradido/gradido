/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { GraphQLError } from 'graphql'
import {
  adminCreateContributionMessage,
  createContribution,
  createContributionMessage,
} from '@/seeds/graphql/mutations'
import { listContributionMessages, login } from '@/seeds/graphql/queries'
import { userFactory } from '@/seeds/factory/user'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { sendAddedContributionMessageEmail } from '@/mailer/sendAddedContributionMessageEmail'

jest.mock('@/mailer/sendAddedContributionMessageEmail', () => {
  return {
    __esModule: true,
    sendAddedContributionMessageEmail: jest.fn(),
  }
})

let mutate: any, query: any, con: any
let testEnv: any
let result: any

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
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
        await query({
          query: login,
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
        await query({
          query: login,
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('input not valid', () => {
        it('throws error when contribution does not exist', async () => {
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
                  'ContributionMessage was not successful: Error: Contribution not found',
                ),
              ],
            }),
          )
        })

        it('throws error when contribution.userId equals user.id', async () => {
          await query({
            query: login,
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
                  'ContributionMessage was not successful: Error: Admin can not answer on own contribution',
                ),
              ],
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

        it('calls sendAddedContributionMessageEmail', async () => {
          expect(sendAddedContributionMessageEmail).toBeCalledWith({
            senderFirstName: 'Peter',
            senderLastName: 'Lustig',
            recipientFirstName: 'Bibi',
            recipientLastName: 'Bloxberg',
            recipientEmail: 'bibi@bloxberg.de',
            senderEmail: 'peter@lustig.de',
            contributionMemo: 'Test env contribution',
            message: 'Admin Test',
            overviewURL: 'http://localhost/overview',
          })
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
        await query({
          query: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('input not valid', () => {
        it('throws error when contribution does not exist', async () => {
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
                  'ContributionMessage was not successful: Error: Contribution not found',
                ),
              ],
            }),
          )
        })

        it('throws error when other user tries to send createContributionMessage', async () => {
          await query({
            query: login,
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
                  'ContributionMessage was not successful: Error: Can not send message to contribution of another user',
                ),
              ],
            }),
          )
        })
      })

      describe('valid input', () => {
        beforeAll(async () => {
          await query({
            query: login,
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
        await query({
          query: login,
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
