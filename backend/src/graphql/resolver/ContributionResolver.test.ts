/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import {
  adminUpdateContribution,
  createContribution,
  updateContribution,
} from '@/seeds/graphql/mutations'
import { listContributions, login } from '@/seeds/graphql/queries'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { GraphQLError } from 'graphql'
import { userFactory } from '@/seeds/factory/user'
import { creationFactory } from '@/seeds/factory/creation'
import { creations } from '@/seeds/creation/index'
import { peterLustig } from '@/seeds/users/peter-lustig'

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
        await query({
          query: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('input not valid', () => {
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
                listContributions: expect.arrayContaining([
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
                listContributions: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(Number),
                    memo: 'Test env contribution',
                    amount: '100',
                  }),
                ]),
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
      })
    })
  })
})
