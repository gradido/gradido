import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { getLogger } from 'config-schema/test/testSetup'
import { AppDatabase, ContributionLink as DbContributionLink, Event as DbEvent } from 'database'
import { Decimal } from 'decimal.js-light'
import { GraphQLError } from 'graphql'
import { DataSource } from 'typeorm'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { EventType } from '@/event/Events'
import { userFactory } from '@/seeds/factory/user'
import {
  createContributionLink,
  deleteContributionLink,
  login,
  updateContributionLink,
} from '@/seeds/graphql/mutations'
import { listContributionLinks } from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

jest.mock('@/password/EncryptorUtils')

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let con: DataSource
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
  db: AppDatabase
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  db = testEnv.db
  await cleanDB()
  await userFactory(testEnv, bibiBloxberg)
  await userFactory(testEnv, peterLustig)
})

afterAll(async () => {
  await cleanDB()
  await con.destroy()
  await db.getRedisClient().quit()
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

        it('stores the ADMIN_CONTRIBUTION_LINK_CREATE event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.ADMIN_CONTRIBUTION_LINK_CREATE,
              affectedUserId: 0,
              actingUserId: expect.any(Number),
              involvedContributionLinkId: expect.any(Number),
              amount: expect.decimalEqual(200),
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

        it('logs the error "A Start-Date must be set"', () => {
          expect(logErrorLogger.error).toBeCalledWith('A Start-Date must be set')
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

        it('logs the error "An End-Date must be set"', () => {
          expect(logErrorLogger.error).toBeCalledWith('An End-Date must be set')
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

        it('logs the error "The value of validFrom must before or equals the validTo"', () => {
          expect(logErrorLogger.error).toBeCalledWith(
            `The value of validFrom must before or equals the validTo`,
          )
        })

        it('returns an error if name is shorter than 5 characters', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: createContributionLink,
            variables: {
              ...variables,
              name: '123',
            },
          })
          expect(errorObjects).toMatchObject([
            {
              message: 'Argument Validation Error',
              extensions: {
                exception: {
                  validationErrors: [
                    {
                      property: 'name',
                      constraints: {
                        minLength: 'name must be longer than or equal to 5 characters',
                      },
                    },
                  ],
                },
              },
            },
          ])
        })

        it('returns an error if name is longer than 100 characters', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: createContributionLink,
            variables: {
              ...variables,
              name: '12345678901234567892123456789312345678941234567895123456789612345678971234567898123456789912345678901',
            },
          })
          expect(errorObjects).toMatchObject([
            {
              message: 'Argument Validation Error',
              extensions: {
                exception: {
                  validationErrors: [
                    {
                      property: 'name',
                      constraints: {
                        maxLength: 'name must be shorter than or equal to 100 characters',
                      },
                    },
                  ],
                },
              },
            },
          ])
        })

        it('returns an error if memo is shorter than 5 characters', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: createContributionLink,
            variables: {
              ...variables,
              memo: '123',
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

        it('returns an error if memo is longer than 512 characters', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: createContributionLink,
            variables: {
              ...variables,
              memo: '123456789012345678921234567893123456789412345678951234567896123456789712345678981234567899123456789012345678901234567892123456789312345678941234567895123456789612345678971234567898123456789912345678901234567890123456789212345678931234567894123456789512345612345678901234567892123456789312345678941234567895123456789612345678971234567898123456789912345678901234567890123456789212345678931234567894123456789512345678961234567897123456789812345678991234567890123456789012345678921234567893123456789412345678951234567',
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

        it('returns an error if amount is not positive', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: createContributionLink,
            variables: {
              ...variables,
              amount: new Decimal(0),
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

        it('logs the error "Contribution Link not found"', () => {
          expect(logErrorLogger.error).toBeCalledWith('Contribution Link not found', -1)
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
            await expect(DbContributionLink.findOne({ where: { id: linkId } })).resolves.toEqual(
              expect.objectContaining({
                id: linkId,
                name: 'Dokumenta 2023',
                memo: 'Danke für deine Teilnahme an der Dokumenta 2023',
                amount: expect.decimalEqual(400),
              }),
            )
          })

          it('stores the ADMIN_CONTRIBUTION_LINK_UPDATE event in the database', async () => {
            await expect(DbEvent.find()).resolves.toContainEqual(
              expect.objectContaining({
                type: EventType.ADMIN_CONTRIBUTION_LINK_UPDATE,
                affectedUserId: 0,
                actingUserId: expect.any(Number),
                involvedContributionLinkId: expect.any(Number),
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

          it('logs the error "Contribution Link not found"', () => {
            expect(logErrorLogger.error).toBeCalledWith('Contribution Link not found', -1)
          })
        })

        describe('valid id', () => {
          let linkId: number
          beforeAll(async () => {
            const links = await query({ query: listContributionLinks })
            linkId = links.data.listContributionLinks.links[0].id
          })

          it('returns true', async () => {
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

          it('stores the ADMIN_CONTRIBUTION_LINK_DELETE event in the database', async () => {
            await expect(DbEvent.find()).resolves.toContainEqual(
              expect.objectContaining({
                type: EventType.ADMIN_CONTRIBUTION_LINK_DELETE,
                affectedUserId: 0,
                actingUserId: expect.any(Number),
                involvedContributionLinkId: linkId,
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
