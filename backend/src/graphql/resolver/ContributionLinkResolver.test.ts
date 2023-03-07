/* eslint-disable @typescript-eslint/no-explicit-any */

import Decimal from 'decimal.js-light'
import { logger } from '@test/testSetup'
import { GraphQLError } from 'graphql'
import {
  login,
  createContributionLink,
  deleteContributionLink,
  updateContributionLink,
} from '@/seeds/graphql/mutations'
import { listContributionLinks } from '@/seeds/graphql/queries'
import { cleanDB, testEnvironment, resetToken } from '@test/helpers'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { userFactory } from '@/seeds/factory/user'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'

let mutate: any, query: any, con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
  await userFactory(testEnv, bibiBloxberg)
  await userFactory(testEnv, peterLustig)
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('Contribution Links', () => {
  const now = new Date()
  const variables = {
    amount: new Decimal(200),
    name: 'Dokumenta 2022',
    memo: 'Danke für deine Teilnahme an der Dokumenta 2022',
    cycle: 'once',
    validFrom: new Date(2022, 5, 18).toISOString(),
    validTo: new Date(now.getFullYear() + 1, 7, 14).toISOString(),
    maxAmountPerMonth: new Decimal(200),
    maxPerCycle: 1,
  }

  describe('unauthenticated', () => {
    afterAll(async () => {
      await cleanDB()
      resetToken()
    })

    describe('createContributionLink', () => {
      it('returns an error', async () => {
        await expect(mutate({ mutation: createContributionLink, variables })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('listContributionLinks', () => {
      it('returns an error', async () => {
        await expect(query({ query: listContributionLinks })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('updateContributionLink', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: updateContributionLink,
            variables: {
              ...variables,
              id: -1,
              amount: new Decimal(400),
              name: 'Dokumenta 2023',
              memo: 'Danke für deine Teilnahme an der Dokumenta 2023',
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('deleteContributionLink', () => {
      it('returns an error', async () => {
        await expect(
          mutate({ mutation: deleteContributionLink, variables: { id: -1 } }),
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

      describe('createContributionLink', () => {
        it('returns an error', async () => {
          await expect(mutate({ mutation: createContributionLink, variables })).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      // TODO: Set this test in new location to have datas
      describe('listContributionLinks', () => {
        it('returns an empty object', async () => {
          await expect(query({ query: listContributionLinks })).resolves.toEqual(
            expect.objectContaining({
              data: {
                listContributionLinks: {
                  count: 0,
                  links: [],
                },
              },
            }),
          )
        })
      })

      describe('updateContributionLink', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: updateContributionLink,
              variables: {
                ...variables,
                id: -1,
                amount: new Decimal(400),
                name: 'Dokumenta 2023',
                memo: 'Danke für deine Teilnahme an der Dokumenta 2023',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('deleteContributionLink', () => {
        it('returns an error', async () => {
          await expect(
            mutate({ mutation: deleteContributionLink, variables: { id: -1 } }),
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
        await userFactory(testEnv, peterLustig)
        await mutate({
          mutation: login,
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('createContributionLink', () => {
        it('returns a contribution link object', async () => {
          await expect(mutate({ mutation: createContributionLink, variables })).resolves.toEqual(
            expect.objectContaining({
              data: {
                createContributionLink: expect.objectContaining({
                  id: expect.any(Number),
                  amount: '200',
                  code: expect.stringMatching(/^[0-9a-f]{24,24}$/),
                  link: expect.stringMatching(/^.*?\/CL-[0-9a-f]{24,24}$/),
                  createdAt: expect.any(String),
                  name: 'Dokumenta 2022',
                  memo: 'Danke für deine Teilnahme an der Dokumenta 2022',
                  validFrom: expect.any(String),
                  validTo: expect.any(String),
                  maxAmountPerMonth: '200',
                  cycle: 'once',
                  maxPerCycle: 1,
                }),
              },
            }),
          )
        })

        it('has a contribution link stored in db', async () => {
          const cls = await DbContributionLink.find()
          expect(cls).toHaveLength(1)
          expect(cls[0]).toEqual(
            expect.objectContaining({
              id: expect.any(Number),
              name: 'Dokumenta 2022',
              memo: 'Danke für deine Teilnahme an der Dokumenta 2022',
              validFrom: new Date('2022-06-18T00:00:00.000Z'),
              validTo: expect.any(Date),
              cycle: 'once',
              maxPerCycle: 1,
              totalMaxCountOfContribution: null,
              maxAccountBalance: null,
              minGapHours: null,
              createdAt: expect.any(Date),
              deletedAt: null,
              code: expect.stringMatching(/^[0-9a-f]{24,24}$/),
              linkEnabled: true,
              amount: expect.decimalEqual(200),
              maxAmountPerMonth: expect.decimalEqual(200),
            }),
          )
        })

        it('returns an error if missing startDate', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionLink,
              variables: {
                ...variables,
                validFrom: null,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('A Start-Date must be set')],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('A Start-Date must be set')
        })

        it('returns an error if missing endDate', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionLink,
              variables: {
                ...variables,
                validTo: null,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('An End-Date must be set')],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('An End-Date must be set')
        })

        it('returns an error if endDate is before startDate', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionLink,
              variables: {
                ...variables,
                validFrom: new Date('2022-06-18T00:00:00.001Z').toISOString(),
                validTo: new Date('2022-06-18T00:00:00.000Z').toISOString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(`The value of validFrom must before or equals the validTo`),
              ],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith(
            `The value of validFrom must before or equals the validTo`,
          )
        })

        it('returns an error if name is shorter than 5 characters', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionLink,
              variables: {
                ...variables,
                name: '123',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('The value of name is too short')],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('The value of name is too short', 3)
        })

        it('returns an error if name is longer than 100 characters', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionLink,
              variables: {
                ...variables,
                name: '12345678901234567892123456789312345678941234567895123456789612345678971234567898123456789912345678901',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('The value of name is too long')],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('The value of name is too long', 101)
        })

        it('returns an error if memo is shorter than 5 characters', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionLink,
              variables: {
                ...variables,
                memo: '123',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('The value of memo is too short')],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('The value of memo is too short', 3)
        })

        it('returns an error if memo is longer than 255 characters', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionLink,
              variables: {
                ...variables,
                memo: '1234567890123456789212345678931234567894123456789512345678961234567897123456789812345678991234567890123456789012345678921234567893123456789412345678951234567896123456789712345678981234567899123456789012345678901234567892123456789312345678941234567895123456',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('The value of memo is too long')],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('The value of memo is too long', 256)
        })

        it('returns an error if amount is not positive', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: createContributionLink,
              variables: {
                ...variables,
                amount: new Decimal(0),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('The amount must be a positiv value')],
            }),
          )
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('The amount must be a positiv value', new Decimal(0))
        })
      })

      describe('listContributionLinks', () => {
        describe('one link in DB', () => {
          it('returns the link and count 1', async () => {
            await expect(query({ query: listContributionLinks })).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listContributionLinks: {
                    links: expect.arrayContaining([
                      expect.objectContaining({
                        amount: '200',
                        code: expect.stringMatching(/^[0-9a-f]{24,24}$/),
                        link: expect.stringMatching(/^.*?\/CL-[0-9a-f]{24,24}$/),
                        createdAt: expect.any(String),
                        name: 'Dokumenta 2022',
                        memo: 'Danke für deine Teilnahme an der Dokumenta 2022',
                        validFrom: expect.any(String),
                        validTo: expect.any(String),
                        maxAmountPerMonth: '200',
                        cycle: 'once',
                        maxPerCycle: 1,
                      }),
                    ]),
                    count: 1,
                  },
                },
              }),
            )
          })
        })
      })

      describe('updateContributionLink', () => {
        describe('no valid id', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: updateContributionLink,
                variables: {
                  ...variables,
                  id: -1,
                  amount: new Decimal(400),
                  name: 'Dokumenta 2023',
                  memo: 'Danke für deine Teilnahme an der Dokumenta 2023',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Contribution Link not found')],
              }),
            )
          })
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('Contribution Link not found', -1)
        })

        describe('valid id', () => {
          let linkId: number
          beforeAll(async () => {
            const links = await query({ query: listContributionLinks })
            linkId = links.data.listContributionLinks.links[0].id
          })

          it('returns updated contribution link object', async () => {
            await expect(
              mutate({
                mutation: updateContributionLink,
                variables: {
                  ...variables,
                  id: linkId,
                  amount: new Decimal(400),
                  name: 'Dokumenta 2023',
                  memo: 'Danke für deine Teilnahme an der Dokumenta 2023',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  updateContributionLink: {
                    id: linkId,
                    amount: '400',
                    code: expect.stringMatching(/^[0-9a-f]{24,24}$/),
                    link: expect.stringMatching(/^.*?\/CL-[0-9a-f]{24,24}$/),
                    createdAt: expect.any(String),
                    name: 'Dokumenta 2023',
                    memo: 'Danke für deine Teilnahme an der Dokumenta 2023',
                    validFrom: expect.any(String),
                    validTo: expect.any(String),
                    maxAmountPerMonth: '200',
                    cycle: 'once',
                    maxPerCycle: 1,
                  },
                },
              }),
            )
          })

          it('updated the DB record', async () => {
            await expect(DbContributionLink.findOne(linkId)).resolves.toEqual(
              expect.objectContaining({
                id: linkId,
                name: 'Dokumenta 2023',
                memo: 'Danke für deine Teilnahme an der Dokumenta 2023',
                amount: expect.decimalEqual(400),
              }),
            )
          })
        })
      })

      describe('deleteContributionLink', () => {
        describe('no valid id', () => {
          it('returns an error', async () => {
            await expect(
              mutate({ mutation: deleteContributionLink, variables: { id: -1 } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Contribution Link not found')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith('Contribution Link not found', -1)
          })
        })

        describe('valid id', () => {
          let linkId: number
          beforeAll(async () => {
            const links = await query({ query: listContributionLinks })
            linkId = links.data.listContributionLinks.links[0].id
          })

          it('returns a date string', async () => {
            await expect(
              mutate({ mutation: deleteContributionLink, variables: { id: linkId } }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  deleteContributionLink: true,
                },
              }),
            )
          })

          it('does not list this contribution link anymore', async () => {
            await expect(query({ query: listContributionLinks })).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listContributionLinks: {
                    links: [],
                    count: 0,
                  },
                },
              }),
            )
          })
        })
      })
    })
  })
})
