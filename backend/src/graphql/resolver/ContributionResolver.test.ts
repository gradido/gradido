/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Decimal from 'decimal.js-light'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import {
  createContribution,
  updateContribution,
  deleteContribution,
  confirmContribution,
  adminCreateContribution,
  adminCreateContributions,
  adminUpdateContribution,
  adminDeleteContribution,
  login,
  adminCreateContributionMessage,
} from '@/seeds/graphql/mutations'
import {
  listAllContributions,
  listContributions,
  listUnconfirmedContributions,
} from '@/seeds/graphql/queries'
import {
  // sendAccountActivationEmail,
  sendContributionConfirmedEmail,
  // sendContributionRejectedEmail,
} from '@/emails/sendEmailVariants'
import {
  cleanDB,
  resetToken,
  testEnvironment,
  contributionDateFormatter,
  resetEntity,
} from '@test/helpers'
import { GraphQLError } from 'graphql'
import { userFactory } from '@/seeds/factory/user'
import { creationFactory } from '@/seeds/factory/creation'
import { creations } from '@/seeds/creation/index'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { EventProtocol } from '@entity/EventProtocol'
import { Contribution } from '@entity/Contribution'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { User } from '@entity/User'
import { EventProtocolType } from '@/event/EventProtocolType'
import { logger, i18n as localization } from '@test/testSetup'
import { UserInputError } from 'apollo-server-express'

// mock account activation email to avoid console spam
// mock account activation email to avoid console spam
jest.mock('@/emails/sendEmailVariants', () => {
  const originalModule = jest.requireActual('@/emails/sendEmailVariants')
  return {
    __esModule: true,
    ...originalModule,
    // TODO: test the call of …
    // sendAccountActivationEmail: jest.fn((a) => originalModule.sendAccountActivationEmail(a)),
    sendContributionConfirmedEmail: jest.fn((a) =>
      originalModule.sendContributionConfirmedEmail(a),
    ),
    // TODO: test the call of …
    // sendContributionRejectedEmail: jest.fn((a) => originalModule.sendContributionRejectedEmail(a)),
  }
})

let mutate: any, query: any, con: any
let testEnv: any
let creation: Contribution | void
let admin: User
let result: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('ContributionResolver', () => {
  let bibi: any

  describe('createContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: createContribution,
            variables: { amount: 100.0, memo: 'Test Contribution', creationDate: 'not-valid' },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated with valid user', () => {
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)

        bibi = await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('input not valid', () => {
        it('throws error when memo length smaller than 5 chars', async () => {
          jest.clearAllMocks()
          const date = new Date()
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: 'Test',
                creationDate: date.toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('memo text is too short (5 characters minimum)')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(`memo text is too short: memo.length=4 < 5`)
        })

        it('throws error when memo length greater than 255 chars', async () => {
          jest.clearAllMocks()
          const date = new Date()
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: 'Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test',
                creationDate: date.toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('memo text is too long (255 characters maximum)')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(`memo text is too long: memo.length=259 > 255`)
        })

        it('throws error when creationDate not-valid', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: 'Test env contribution',
                creationDate: 'not-valid',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError('No information for available creations for the given date'),
              ],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(
            'No information for available creations with the given creationDate=',
            'Invalid Date',
          )
        })

        it('throws error when creationDate 3 month behind', async () => {
          jest.clearAllMocks()
          const date = new Date()
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: 'Test env contribution',
                creationDate: date.setMonth(date.getMonth() - 3).toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError('No information for available creations for the given date'),
              ],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(
            'No information for available creations with the given creationDate=',
            'Invalid Date',
          )
        })
      })

      describe('valid input', () => {
        let contribution: any

        beforeAll(async () => {
          contribution = await mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test env contribution',
              creationDate: new Date().toString(),
            },
          })
        })

        it('creates contribution', async () => {
          expect(contribution).toEqual(
            expect.objectContaining({
              data: {
                createContribution: {
                  id: expect.any(Number),
                  amount: '100',
                  memo: 'Test env contribution',
                },
              },
            }),
          )
        })

        it('stores the create contribution event in the database', async () => {
          await expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.CONTRIBUTION_CREATE,
              amount: expect.decimalEqual(100),
              contributionId: contribution.data.createContribution.id,
              userId: bibi.data.login.id,
            }),
          )
        })
      })
    })
  })

  describe('listContributions', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          query({
            query: listContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              filterConfirmed: false,
            },
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
        const bibisCreation = creations.find((creation) => creation.email === 'bibi@bloxberg.de')
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await creationFactory(testEnv, bibisCreation!)
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test env contribution',
            creationDate: new Date().toString(),
          },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('filter confirmed is false', () => {
        it('returns creations', async () => {
          await expect(
            query({
              query: listContributions,
              variables: {
                currentPage: 1,
                pageSize: 25,
                order: 'DESC',
                filterConfirmed: false,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                listContributions: {
                  contributionCount: 2,
                  contributionList: expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      memo: 'Herzlich Willkommen bei Gradido!',
                      amount: '1000',
                    }),
                    expect.objectContaining({
                      id: expect.any(Number),
                      memo: 'Test env contribution',
                      amount: '100',
                    }),
                  ]),
                },
              },
            }),
          )
        })
      })

      describe('filter confirmed is true', () => {
        it('returns only unconfirmed creations', async () => {
          await expect(
            query({
              query: listContributions,
              variables: {
                currentPage: 1,
                pageSize: 25,
                order: 'DESC',
                filterConfirmed: true,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                listContributions: {
                  contributionCount: 1,
                  contributionList: expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(Number),
                      memo: 'Test env contribution',
                      amount: '100',
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

  describe('updateContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: updateContribution,
            variables: {
              contributionId: 1,
              amount: 100.0,
              memo: 'Test Contribution',
              creationDate: 'not-valid',
            },
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
        await userFactory(testEnv, peterLustig)
        await userFactory(testEnv, bibiBloxberg)
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
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('wrong contribution id', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: -1,
                amount: 100.0,
                memo: 'Test env contribution',
                creationDate: new Date().toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('No contribution found to given id.')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith('No contribution found to given id')
        })
      })

      describe('Memo length smaller than 5 chars', () => {
        it('throws error', async () => {
          jest.clearAllMocks()
          const date = new Date()
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 100.0,
                memo: 'Test',
                creationDate: date.toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('memo text is too short (5 characters minimum)')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith('memo text is too short: memo.length=4 < 5')
        })
      })

      describe('Memo length greater than 255 chars', () => {
        it('throws error', async () => {
          jest.clearAllMocks()
          const date = new Date()
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 100.0,
                memo: 'Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test',
                creationDate: date.toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('memo text is too long (255 characters maximum)')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith('memo text is too long: memo.length=259 > 255')
        })
      })

      describe('wrong user tries to update the contribution', () => {
        beforeAll(async () => {
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        it('throws an error', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 10.0,
                memo: 'Test env contribution',
                creationDate: new Date().toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'user of the pending contribution and send user does not correspond',
                ),
              ],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(
            'user of the pending contribution and send user does not correspond',
          )
        })
      })

      describe('admin tries to update a user contribution', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: adminUpdateContribution,
              variables: {
                id: result.data.createContribution.id,
                email: 'bibi@bloxberg.de',
                amount: 10.0,
                memo: 'Test env contribution',
                creationDate: new Date().toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('An admin is not allowed to update a user contribution.')],
            }),
          )
        })

        // TODO check that the error is logged (need to modify AdminResolver, avoid conflicts)
      })

      describe('update too much so that the limit is exceeded', () => {
        beforeAll(async () => {
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        it('throws an error', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 1019.0,
                memo: 'Test env contribution',
                creationDate: new Date().toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'The amount (1019 GDD) to be created exceeds the amount (1000 GDD) still available for this month.',
                ),
              ],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(
            'The amount (1019 GDD) to be created exceeds the amount (1000 GDD) still available for this month.',
          )
        })
      })

      describe('update creation to a date that is older than 3 months', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          const date = new Date()
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 10.0,
                memo: 'Test env contribution',
                creationDate: date.setMonth(date.getMonth() - 3).toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Currently the month of the contribution cannot change.')],
            }),
          )
        })

        it.skip('logs the error found', () => {
          expect(logger.error).toBeCalledWith(
            'No information for available creations with the given creationDate=',
            'Invalid Date',
          )
        })
      })

      describe('valid input', () => {
        it('updates contribution', async () => {
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 10.0,
                memo: 'Test contribution',
                creationDate: new Date().toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                updateContribution: {
                  id: result.data.createContribution.id,
                  amount: '10',
                  memo: 'Test contribution',
                },
              },
            }),
          )
        })

        it('stores the update contribution event in the database', async () => {
          bibi = await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })

          await expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.CONTRIBUTION_UPDATE,
              amount: expect.decimalEqual(10),
              contributionId: result.data.createContribution.id,
              userId: bibi.data.login.id,
            }),
          )
        })
      })
    })
  })

  describe('listAllContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: null,
            },
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
        // const bibisCreation = creations.find((creation) => creation.email === 'bibi@bloxberg.de')
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        const pendingContribution = await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test PENDING contribution',
            creationDate: new Date().toString(),
          },
        })
        const inProgressContribution = await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test IN_PROGRESS contribution',
            creationDate: new Date().toString(),
          },
        })
        const confirmedContribution = await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test CONFIRMED contribution',
            creationDate: new Date().toString(),
          },
        })
        // const deniedContribution = await mutate({
        //   mutation: createContribution,
        //   variables: {
        //     amount: 100.0,
        //     memo: 'Test DENIED contribution',
        //     creationDate: new Date().toString(),
        //   },
        // })
        const deletedContribution = await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test DELETED contribution',
            creationDate: new Date().toString(),
          },
        })
        await mutate({
          mutation: login,
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
        })
        await mutate({
          mutation: adminCreateContributionMessage,
          variables: {
            contributionId: inProgressContribution.data.createContribution.id,
            message: 'Test message',
          },
        })
        await mutate({
          mutation: confirmContribution,
          variables: {
            id: confirmedContribution.data.createContribution.id,
          },
        })
        await mutate({
          mutation: adminDeleteContribution,
          variables: {
            id: deletedContribution.data.createContribution.id,
          },
        })
        // await mutate({
        //   mutation: denyContribution,
        //   variables: {
        //     id: deniedContribution.data.createContribution.id,
        //   },
        // })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      it('throws an error with "NOT_VALID" in statusFilter', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: ['NOT_VALID'],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [
              new UserInputError(
                'Variable "$statusFilter" got invalid value "NOT_VALID" at "statusFilter[0]"; Value "NOT_VALID" does not exist in "ContributionStatus" enum.',
              ),
            ],
          }),
        )
      })

      it('throws an error with a null in statusFilter', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: [null],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [
              new UserInputError(
                'Variable "$statusFilter" got invalid value null at "statusFilter[0]"; Expected non-nullable type "ContributionStatus!" not to be null.',
              ),
            ],
          }),
        )
      })

      it('throws an error with null and "NOT_VALID" in statusFilter', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: [null, 'NOT_VALID'],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [
              new UserInputError(
                'Variable "$statusFilter" got invalid value null at "statusFilter[0]"; Expected non-nullable type "ContributionStatus!" not to be null.',
              ),
              new UserInputError(
                'Variable "$statusFilter" got invalid value "NOT_VALID" at "statusFilter[1]"; Value "NOT_VALID" does not exist in "ContributionStatus" enum.',
              ),
            ],
          }),
        )
      })

      it('returns all contributions without statusFilter', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 3,
                contributionList: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'IN_PROGRESS',
                    memo: 'Test IN_PROGRESS contribution',
                    amount: '100',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'CONFIRMED',
                    memo: 'Test CONFIRMED contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })

      it('returns all contributions for statusFilter = null', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: null,
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 3,
                contributionList: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'IN_PROGRESS',
                    memo: 'Test IN_PROGRESS contribution',
                    amount: '100',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'CONFIRMED',
                    memo: 'Test CONFIRMED contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })

      it('returns all contributions for statusFilter = []', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: [],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 3,
                contributionList: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'IN_PROGRESS',
                    memo: 'Test IN_PROGRESS contribution',
                    amount: '100',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'CONFIRMED',
                    memo: 'Test CONFIRMED contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })

      it('returns all CONFIRMED contributions', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: ['CONFIRMED'],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 1,
                contributionList: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'CONFIRMED',
                    memo: 'Test CONFIRMED contribution',
                    amount: '100',
                  }),
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'IN_PROGRESS',
                    memo: 'Test IN_PROGRESS contribution',
                    amount: '100',
                  }),
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'DELETED',
                    memo: 'Test DELETED contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })

      it('returns all PENDING contributions', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: ['PENDING'],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 1,
                contributionList: expect.arrayContaining([
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'CONFIRMED',
                    memo: 'Test CONFIRMED contribution',
                    amount: '100',
                  }),
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'IN_PROGRESS',
                    memo: 'Test IN_PROGRESS contribution',
                    amount: '100',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'DELETED',
                    memo: 'Test DELETED contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })

      it('returns all IN_PROGRESS Creation', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: ['IN_PROGRESS'],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 1,
                contributionList: expect.arrayContaining([
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'CONFIRMED',
                    memo: 'Test CONFIRMED contribution',
                    amount: '100',
                  }),
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'IN_PROGRESS',
                    memo: 'Test IN_PROGRESS contribution',
                    amount: '100',
                  }),
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                  expect.not.objectContaining({
                    id: expect.any(Number),
                    state: 'DELETED',
                    memo: 'Test DELETED contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })

      it('returns all DENIED Creation', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: ['DENIED'],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 0,
                contributionList: expect.not.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })

      it('returns all DELETED Creation', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: ['DELETED'],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 0,
                contributionList: expect.not.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })

      it('returns all CONFIRMED and PENDING Creation', async () => {
        await expect(
          query({
            query: listAllContributions,
            variables: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
              statusFilter: ['CONFIRMED', 'PENDING'],
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              listAllContributions: {
                contributionCount: 2,
                contributionList: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    state: 'PENDING',
                    memo: 'Test PENDING contribution',
                    amount: '100',
                  }),
                ]),
              },
            },
          }),
        )
      })
    })
  })

  describe('deleteContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          query({
            query: deleteContribution,
            variables: {
              id: -1,
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      let peter: any
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        peter = await userFactory(testEnv, peterLustig)

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
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('wrong contribution id', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: deleteContribution,
              variables: {
                id: -1,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Contribution not found for given id.')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith('Contribution not found for given id')
        })
      })

      describe('other user sends a deleteContribution', () => {
        it('returns an error', async () => {
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
          await expect(
            mutate({
              mutation: deleteContribution,
              variables: {
                id: result.data.createContribution.id,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Can not delete contribution of another user')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith('Can not delete contribution of another user')
        })
      })

      describe('User deletes own contribution', () => {
        it('deletes successfully', async () => {
          await expect(
            mutate({
              mutation: deleteContribution,
              variables: {
                id: result.data.createContribution.id,
              },
            }),
          ).resolves.toBeTruthy()
        })

        it('stores the delete contribution event in the database', async () => {
          const contribution = await mutate({
            mutation: createContribution,
            variables: {
              amount: 166.0,
              memo: 'Whatever contribution',
              creationDate: new Date().toString(),
            },
          })

          await mutate({
            mutation: deleteContribution,
            variables: {
              id: contribution.data.createContribution.id,
            },
          })

          await expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.CONTRIBUTION_DELETE,
              contributionId: contribution.data.createContribution.id,
              amount: expect.decimalEqual(166),
              userId: peter.id,
            }),
          )
        })
      })

      describe('User deletes already confirmed contribution', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
          await mutate({
            mutation: confirmContribution,
            variables: {
              id: result.data.createContribution.id,
            },
          })
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
          await expect(
            mutate({
              mutation: deleteContribution,
              variables: {
                id: result.data.createContribution.id,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('A confirmed contribution can not be deleted')],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith('A confirmed contribution can not be deleted')
        })
      })
    })
  })

  describe('contributions', () => {
    const variables = {
      email: 'bibi@bloxberg.de',
      amount: new Decimal(2000),
      memo: 'Aktives Grundeinkommen',
      creationDate: 'not-valid',
    }

    describe('unauthenticated', () => {
      describe('adminCreateContribution', () => {
        it('returns an error', async () => {
          await expect(mutate({ mutation: adminCreateContribution, variables })).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('adminCreateContributions', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: adminCreateContributions,
              variables: { pendingCreations: [variables] },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('adminUpdateContribution', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: adminUpdateContribution,
              variables: {
                id: 1,
                email: 'bibi@bloxberg.de',
                amount: new Decimal(300),
                memo: 'Danke Bibi!',
                creationDate: contributionDateFormatter(new Date()),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('listUnconfirmedContributions', () => {
        it('returns an error', async () => {
          await expect(
            query({
              query: listUnconfirmedContributions,
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('adminDeleteContribution', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: adminDeleteContribution,
              variables: {
                id: 1,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('confirmContribution', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: confirmContribution,
              variables: {
                id: 1,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })
    })

    describe('authenticated', () => {
      describe('without admin rights', () => {
        beforeAll(async () => {
          await userFactory(testEnv, bibiBloxberg)
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('adminCreateContribution', () => {
          it('returns an error', async () => {
            await expect(mutate({ mutation: adminCreateContribution, variables })).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('adminCreateContributions', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: adminCreateContributions,
                variables: { pendingCreations: [variables] },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('adminUpdateContribution', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: adminUpdateContribution,
                variables: {
                  id: 1,
                  email: 'bibi@bloxberg.de',
                  amount: new Decimal(300),
                  memo: 'Danke Bibi!',
                  creationDate: contributionDateFormatter(new Date()),
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('listUnconfirmedContributions', () => {
          it('returns an error', async () => {
            await expect(
              query({
                query: listUnconfirmedContributions,
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('adminDeleteContribution', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: adminDeleteContribution,
                variables: {
                  id: 1,
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('confirmContribution', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: confirmContribution,
                variables: {
                  id: 1,
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })
      })

      describe('with admin rights', () => {
        beforeAll(async () => {
          admin = await userFactory(testEnv, peterLustig)
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('adminCreateContribution', () => {
          const now = new Date()

          beforeAll(async () => {
            await mutate({
              mutation: adminCreateContribution,
              variables: {
                email: 'peter@lustig.de',
                amount: 400,
                memo: 'Herzlich Willkommen bei Gradido!',
                creationDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 1, 1),
                ),
              },
            })
            creation = await Contribution.findOneOrFail({
              where: {
                memo: 'Herzlich Willkommen bei Gradido!',
              },
            })
          })

          describe('user to create for does not exist', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              variables.creationDate = contributionDateFormatter(
                new Date(now.getFullYear(), now.getMonth() - 1, 1),
              )
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Could not find user with email: bibi@bloxberg.de')],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith(
                'Could not find user with email: bibi@bloxberg.de',
              )
            })
          })

          describe('user to create for is deleted', () => {
            beforeAll(async () => {
              await userFactory(testEnv, stephenHawking)
              variables.email = 'stephen@hawking.uk'
              variables.creationDate = contributionDateFormatter(
                new Date(now.getFullYear(), now.getMonth() - 1, 1),
              )
            })

            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError('This user was deleted. Cannot create a contribution.'),
                  ],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith(
                'This user was deleted. Cannot create a contribution.',
              )
            })
          })

          describe('user to create for has email not confirmed', () => {
            beforeAll(async () => {
              await userFactory(testEnv, garrickOllivander)
              variables.email = 'garrick@ollivander.com'
              variables.creationDate = contributionDateFormatter(
                new Date(now.getFullYear(), now.getMonth() - 1, 1),
              )
            })

            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError('Contribution could not be saved, Email is not activated'),
                  ],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith(
                'Contribution could not be saved, Email is not activated',
              )
            })
          })

          describe('valid user to create for', () => {
            beforeAll(async () => {
              await userFactory(testEnv, bibiBloxberg)
              variables.email = 'bibi@bloxberg.de'
              variables.creationDate = 'invalid-date'
            })

            describe('date of creation is not a date string', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError(`invalid Date for creationDate=invalid-date`)],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logger.error).toBeCalledWith(`invalid Date for creationDate=invalid-date`)
              })
            })

            describe('date of creation is four months ago', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                variables.creationDate = contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 4, 1),
                )
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError('No information for available creations for the given date'),
                    ],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logger.error).toBeCalledWith(
                  'No information for available creations with the given creationDate=',
                  new Date(variables.creationDate).toString(),
                )
              })
            })

            describe('date of creation is in the future', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                variables.creationDate = contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() + 4, 1),
                )
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError('No information for available creations for the given date'),
                    ],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logger.error).toBeCalledWith(
                  'No information for available creations with the given creationDate=',
                  new Date(variables.creationDate).toString(),
                )
              })
            })

            describe('amount of creation is too high', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                variables.creationDate = contributionDateFormatter(now)
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError(
                        'The amount (2000 GDD) to be created exceeds the amount (1000 GDD) still available for this month.',
                      ),
                    ],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logger.error).toBeCalledWith(
                  'The amount (2000 GDD) to be created exceeds the amount (1000 GDD) still available for this month.',
                )
              })
            })

            describe('creation is valid', () => {
              it('returns an array of the open creations for the last three months', async () => {
                variables.amount = new Decimal(200)
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    data: {
                      adminCreateContribution: [1000, 1000, 800],
                    },
                  }),
                )
              })

              it('stores the admin create contribution event in the database', async () => {
                await expect(EventProtocol.find()).resolves.toContainEqual(
                  expect.objectContaining({
                    type: EventProtocolType.ADMIN_CONTRIBUTION_CREATE,
                    userId: admin.id,
                  }),
                )
              })
            })

            describe('second creation surpasses the available amount ', () => {
              it('returns an array of the open creations for the last three months', async () => {
                variables.amount = new Decimal(1000)
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError(
                        'The amount (1000 GDD) to be created exceeds the amount (800 GDD) still available for this month.',
                      ),
                    ],
                  }),
                )
              })

              it('logs the error thrown', () => {
                expect(logger.error).toBeCalledWith(
                  'The amount (1000 GDD) to be created exceeds the amount (800 GDD) still available for this month.',
                )
              })
            })
          })
        })

        describe('adminCreateContributions', () => {
          // at this point we have this data in DB:
          // bibi@bloxberg.de: [1000, 1000, 800]
          // peter@lustig.de: [1000, 600, 1000]
          // stephen@hawking.uk: [1000, 1000, 1000] - deleted
          // garrick@ollivander.com: [1000, 1000, 1000] - not activated

          const massCreationVariables = [
            'bibi@bloxberg.de',
            'peter@lustig.de',
            'stephen@hawking.uk',
            'garrick@ollivander.com',
            'bob@baumeister.de',
          ].map((email) => {
            return {
              email,
              amount: new Decimal(500),
              memo: 'Grundeinkommen',
              creationDate: contributionDateFormatter(new Date()),
            }
          })

          it('returns success, two successful creation and three failed creations', async () => {
            await expect(
              mutate({
                mutation: adminCreateContributions,
                variables: { pendingCreations: massCreationVariables },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  adminCreateContributions: {
                    success: true,
                    successfulContribution: ['bibi@bloxberg.de', 'peter@lustig.de'],
                    failedContribution: [
                      'stephen@hawking.uk',
                      'garrick@ollivander.com',
                      'bob@baumeister.de',
                    ],
                  },
                },
              }),
            )
          })
        })

        describe('adminUpdateContribution', () => {
          // at this I expect to have this data in DB:
          // bibi@bloxberg.de: [1000, 1000, 300]
          // peter@lustig.de: [1000, 600, 500]
          // stephen@hawking.uk: [1000, 1000, 1000] - deleted
          // garrick@ollivander.com: [1000, 1000, 1000] - not activated

          describe('user for creation to update does not exist', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: 1,
                    email: 'bob@baumeister.de',
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError('Could not find UserContact with email: bob@baumeister.de'),
                  ],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith(
                'Could not find UserContact with email: bob@baumeister.de',
              )
            })
          })

          describe('user for creation to update is deleted', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: 1,
                    email: 'stephen@hawking.uk',
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('User was deleted (stephen@hawking.uk)')],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith('User was deleted (stephen@hawking.uk)')
            })
          })

          describe('creation does not exist', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: -1,
                    email: 'bibi@bloxberg.de',
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('No contribution found to given id.')],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith('No contribution found to given id.')
            })
          })

          describe('user email does not match creation user', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                    email: 'bibi@bloxberg.de',
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: creation
                      ? contributionDateFormatter(creation.contributionDate)
                      : contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError(
                      'user of the pending contribution and send user does not correspond',
                    ),
                  ],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith(
                'user of the pending contribution and send user does not correspond',
              )
            })
          })

          describe('creation update is not valid', () => {
            // as this test has not clearly defined that date, it is a false positive
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                    email: 'peter@lustig.de',
                    amount: new Decimal(1900),
                    memo: 'Danke Peter!',
                    creationDate: creation
                      ? contributionDateFormatter(creation.contributionDate)
                      : contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError(
                      'The amount (1900 GDD) to be created exceeds the amount (1000 GDD) still available for this month.',
                    ),
                  ],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith(
                'The amount (1900 GDD) to be created exceeds the amount (1000 GDD) still available for this month.',
              )
            })
          })

          describe.skip('creation update is successful changing month', () => {
            // skipped as changing the month is currently disable
            it('returns update creation object', async () => {
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                    email: 'peter@lustig.de',
                    amount: new Decimal(300),
                    memo: 'Danke Peter!',
                    creationDate: creation
                      ? contributionDateFormatter(creation.contributionDate)
                      : contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: {
                    adminUpdateContribution: {
                      date: expect.any(String),
                      memo: 'Danke Peter!',
                      amount: '300',
                      creation: ['1000', '700', '500'],
                    },
                  },
                }),
              )
            })

            it('stores the admin update contribution event in the database', async () => {
              await expect(EventProtocol.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventProtocolType.ADMIN_CONTRIBUTION_UPDATE,
                  userId: admin.id,
                }),
              )
            })
          })

          describe('creation update is successful without changing month', () => {
            // actually this mutation IS changing the month
            it('returns update creation object', async () => {
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                    email: 'peter@lustig.de',
                    amount: new Decimal(200),
                    memo: 'Das war leider zu Viel!',
                    creationDate: creation
                      ? contributionDateFormatter(creation.contributionDate)
                      : contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: {
                    adminUpdateContribution: {
                      date: expect.any(String),
                      memo: 'Das war leider zu Viel!',
                      amount: '200',
                      creation: ['1000', '800', '500'],
                    },
                  },
                }),
              )
            })

            it('stores the admin update contribution event in the database', async () => {
              await expect(EventProtocol.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventProtocolType.ADMIN_CONTRIBUTION_UPDATE,
                  userId: admin.id,
                }),
              )
            })
          })
        })

        describe('listUnconfirmedContributions', () => {
          it('returns four pending creations', async () => {
            await expect(
              query({
                query: listUnconfirmedContributions,
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listUnconfirmedContributions: expect.arrayContaining([
                    {
                      id: expect.any(Number),
                      firstName: 'Peter',
                      lastName: 'Lustig',
                      email: 'peter@lustig.de',
                      date: expect.any(String),
                      memo: 'Das war leider zu Viel!',
                      amount: '200',
                      moderator: admin.id,
                      creation: ['1000', '800', '500'],
                    },
                    {
                      id: expect.any(Number),
                      firstName: 'Peter',
                      lastName: 'Lustig',
                      email: 'peter@lustig.de',
                      date: expect.any(String),
                      memo: 'Grundeinkommen',
                      amount: '500',
                      moderator: admin.id,
                      creation: ['1000', '800', '500'],
                    },
                    {
                      id: expect.any(Number),
                      firstName: 'Bibi',
                      lastName: 'Bloxberg',
                      email: 'bibi@bloxberg.de',
                      date: expect.any(String),
                      memo: 'Grundeinkommen',
                      amount: '500',
                      moderator: admin.id,
                      creation: ['1000', '1000', '300'],
                    },
                    {
                      id: expect.any(Number),
                      firstName: 'Bibi',
                      lastName: 'Bloxberg',
                      email: 'bibi@bloxberg.de',
                      date: expect.any(String),
                      memo: 'Aktives Grundeinkommen',
                      amount: '200',
                      moderator: admin.id,
                      creation: ['1000', '1000', '300'],
                    },
                  ]),
                },
              }),
            )
          })
        })

        describe('adminDeleteContribution', () => {
          describe('creation id does not exist', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Contribution not found for given id.')],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith('Contribution not found for given id: -1')
            })
          })

          describe('admin deletes own user contribution', () => {
            beforeAll(async () => {
              await query({
                query: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
              result = await mutate({
                mutation: createContribution,
                variables: {
                  amount: 100.0,
                  memo: 'Test env contribution',
                  creationDate: contributionDateFormatter(new Date()),
                },
              })
            })

            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: result.data.createContribution.id,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Own contribution can not be deleted as admin')],
                }),
              )
            })
          })

          describe('creation id does exist', () => {
            it('returns true', async () => {
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { adminDeleteContribution: true },
                }),
              )
            })

            it('stores the admin  delete contribution event in the database', async () => {
              await expect(EventProtocol.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventProtocolType.ADMIN_CONTRIBUTION_DELETE,
                  userId: admin.id,
                }),
              )
            })
          })

          describe('creation already confirmed', () => {
            it('throws an error', async () => {
              await userFactory(testEnv, bobBaumeister)
              await query({
                query: login,
                variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
              })
              const {
                data: { createContribution: confirmedContribution },
              } = await mutate({
                mutation: createContribution,
                variables: {
                  amount: 100.0,
                  memo: 'Confirmed Contribution',
                  creationDate: contributionDateFormatter(new Date()),
                },
              })
              await query({
                query: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
              await mutate({
                mutation: confirmContribution,
                variables: {
                  id: confirmedContribution.id ? confirmedContribution.id : -1,
                },
              })
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: confirmedContribution.id ? confirmedContribution.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('A confirmed contribution can not be deleted')],
                }),
              )
              await resetEntity(DbTransaction)
            })
          })
        })

        describe('confirmContribution', () => {
          describe('creation does not exits', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: confirmContribution,
                  variables: {
                    id: -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Contribution not found to given id.')],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith('Contribution not found for given id: -1')
            })
          })

          describe('confirm own creation', () => {
            beforeAll(async () => {
              const now = new Date()
              creation = await creationFactory(testEnv, {
                email: 'peter@lustig.de',
                amount: 400,
                memo: 'Herzlich Willkommen bei Gradido!',
                creationDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 1, 1),
                ),
              })
            })

            it('thows an error', async () => {
              await expect(
                mutate({
                  mutation: confirmContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Moderator can not confirm own contribution')],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith('Moderator can not confirm own contribution')
            })
          })

          describe('confirm creation for other user', () => {
            beforeAll(async () => {
              const now = new Date()
              creation = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 450,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                creationDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 2, 1),
                ),
              })
              await query({
                query: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
            })

            it('returns true', async () => {
              await expect(
                mutate({
                  mutation: confirmContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { confirmContribution: true },
                }),
              )
            })

            it('stores the contribution confirm event in the database', async () => {
              await expect(EventProtocol.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventProtocolType.CONTRIBUTION_CONFIRM,
                }),
              )
            })

            it('creates a transaction', async () => {
              const transaction = await DbTransaction.find()
              expect(transaction[0].amount.toString()).toBe('450')
              expect(transaction[0].memo).toBe('Herzlich Willkommen bei Gradido liebe Bibi!')
              expect(transaction[0].linkedTransactionId).toEqual(null)
              expect(transaction[0].transactionLinkId).toEqual(null)
              expect(transaction[0].previous).toEqual(null)
              expect(transaction[0].linkedUserId).toEqual(null)
              expect(transaction[0].typeId).toEqual(1)
            })

            it('calls sendContributionConfirmedEmail', async () => {
              expect(sendContributionConfirmedEmail).toBeCalledWith({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                email: 'bibi@bloxberg.de',
                language: 'de',
                senderFirstName: 'Peter',
                senderLastName: 'Lustig',
                contributionMemo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                contributionAmount: expect.decimalEqual(450),
              })
            })

            it('stores the send confirmation email event in the database', async () => {
              await expect(EventProtocol.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventProtocolType.SEND_CONFIRMATION_EMAIL,
                }),
              )
            })

            describe('confirm same contribution again', () => {
              it('throws an error', async () => {
                await expect(
                  mutate({
                    mutation: confirmContribution,
                    variables: {
                      id: creation ? creation.id : -1,
                    },
                  }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('Contribution already confirmd.')],
                  }),
                )
              })
            })
          })

          describe('confirm two creations one after the other quickly', () => {
            let c1: Contribution | void
            let c2: Contribution | void

            beforeAll(async () => {
              const now = new Date()
              c1 = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 50,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                creationDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 2, 1),
                ),
              })
              c2 = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 50,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                creationDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 2, 1),
                ),
              })
              await query({
                query: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
            })

            it('throws no error for the second confirmation', async () => {
              const r1 = mutate({
                mutation: confirmContribution,
                variables: {
                  id: c1 ? c1.id : -1,
                },
              })
              const r2 = mutate({
                mutation: confirmContribution,
                variables: {
                  id: c2 ? c2.id : -1,
                },
              })
              await expect(r1).resolves.toEqual(
                expect.objectContaining({
                  data: { confirmContribution: true },
                }),
              )
              await expect(r2).resolves.toEqual(
                expect.objectContaining({
                  data: { confirmContribution: true },
                }),
              )
            })
          })
        })
      })
    })
  })
})
