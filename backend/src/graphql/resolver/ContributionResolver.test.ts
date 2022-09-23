/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import {
  adminUpdateContribution,
  confirmContribution,
  createContribution,
  deleteContribution,
  updateContribution,
} from '@/seeds/graphql/mutations'
import { listAllContributions, listContributions, login } from '@/seeds/graphql/queries'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { GraphQLError } from 'graphql'
import { userFactory } from '@/seeds/factory/user'
import { creationFactory } from '@/seeds/factory/creation'
import { creations } from '@/seeds/creation/index'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { EventProtocol } from '@entity/EventProtocol'
import { EventProtocolType } from '@/event/EventProtocolType'
import { logger } from '@test/testSetup'

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
        bibi = await query({
          query: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('input not valid', () => {
        it('throws error when memo length smaller than 5 chars', async () => {
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
          expect(logger.error).toBeCalledWith(`memo text is too short: memo.length=4 < (5)`)
        })

        it('throws error when memo length greater than 255 chars', async () => {
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
          expect(logger.error).toBeCalledWith(`memo text is too long: memo.length=259 > (255)`)
        })

        it('throws error when creationDate not-valid', async () => {
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
            'No information for available creations for the given date',
          )
        })

        it('throws error when creationDate 3 month behind', async () => {
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
            'No information for available creations for the given date',
          )
        })
      })

      describe('valid input', () => {
        it('creates contribution', async () => {
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: 'Test env contribution',
                creationDate: new Date().toString(),
              },
            }),
          ).resolves.toEqual(
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
        await query({
          query: login,
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
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('wrong contribution id', () => {
        it('throws an error', async () => {
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
          expect(logger.error).toBeCalledWith('memo text is too short: memo.length=4 < (5)')
        })
      })

      describe('Memo length greater than 255 chars', () => {
        it('throws error', async () => {
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
          expect(logger.error).toBeCalledWith('memo text is too long: memo.length=259 > (255)')
        })
      })

      describe('wrong user tries to update the contribution', () => {
        beforeAll(async () => {
          await query({
            query: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        it('throws an error', async () => {
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
          await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        it('throws an error', async () => {
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
              errors: [
                new GraphQLError('No information for available creations for the given date'),
              ],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(
            'No information for available creations for the given date',
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
          await expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.CONTRIBUTION_UPDATE,
              contributionId: result.data.createContribution.id,
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
        await query({
          query: login,
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

      it('returns allCreation', async () => {
        await expect(
          query({
            query: listAllContributions,
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
              listAllContributions: {
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
          await query({
            query: login,
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
            }),
          )
        })
      })

      describe('User deletes already confirmed contribution', () => {
        it('throws an error', async () => {
          await query({
            query: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
          await mutate({
            mutation: confirmContribution,
            variables: {
              id: result.data.createContribution.id,
            },
          })
          await query({
            query: login,
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
})
