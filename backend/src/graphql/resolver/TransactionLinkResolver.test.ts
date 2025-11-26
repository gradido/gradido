import { ApolloServerTestClient } from 'apollo-server-testing'
import {
  ContributionLink as DbContributionLink,
  Event as DbEvent,
  Transaction,
  User,
  UserContact,
} from 'database'
import { Decimal } from 'decimal.js-light'
import { GraphQLError } from 'graphql'
import { DataSource } from 'typeorm'

import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import { cleanDB, resetEntity, resetToken, testEnvironment } from '@test/helpers'

import { EventType } from '@/event/Events'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { transactionLinkFactory } from '@/seeds/factory/transactionLink'
import { userFactory } from '@/seeds/factory/user'
import {
  confirmContribution,
  createContribution,
  createContributionLink,
  createTransactionLink,
  deleteTransactionLink,
  login,
  redeemTransactionLink,
  updateContribution,
} from '@/seeds/graphql/mutations'
import { listTransactionLinksAdmin } from '@/seeds/graphql/queries'
import { transactionLinks } from '@/seeds/transactionLink/index'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { TRANSACTIONS_LOCK } from 'database'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { getLogger } from 'config-schema/test/testSetup'
import { transactionLinkCode } from './TransactionLinkResolver'
import { CONFIG } from '@/config'

const logErrorLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

jest.mock('@/password/EncryptorUtils')

CONFIG.DLT_ACTIVE = false

// mock semaphore to allow use fake timers
jest.mock('database/src/util/TRANSACTIONS_LOCK')
TRANSACTIONS_LOCK.acquire = jest.fn().mockResolvedValue(jest.fn())

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let con: DataSource
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
}

let user: User

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
  await con.destroy()
})

describe('TransactionLinkResolver', () => {
  describe('createTransactionLink', () => {
    describe('unauthenticated', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        resetToken()
        await expect(
          mutate({ mutation: createTransactionLink, variables: { amount: 0, memo: 'Test' } }),
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
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
        })
      })

      it('throws error when amount is zero', async () => {
        jest.clearAllMocks()
        const { errors: errorObjects } = await mutate({
          mutation: createTransactionLink,
          variables: {
            amount: 0,
            memo: 'Test Test',
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

      it('throws error when amount is negative', async () => {
        jest.clearAllMocks()
        const { errors: errorObjects } = await mutate({
          mutation: createTransactionLink,
          variables: {
            amount: -10,
            memo: 'Test Test',
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

      it('throws error when memo text is too short', async () => {
        jest.clearAllMocks()
        const { errors: errorObjects } = await mutate({
          mutation: createTransactionLink,
          variables: {
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

      it('throws error when memo text is too long', async () => {
        jest.clearAllMocks()
        const { errors: errorObjects } = await mutate({
          mutation: createTransactionLink,
          variables: {
            identifier: 'peter@lustig.de',
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

      it('throws error when user has not enough GDD', async () => {
        jest.clearAllMocks()
        await expect(
          mutate({
            mutation: createTransactionLink,
            variables: {
              amount: 1001,
              memo: 'Test Test',
            },
          }),
        ).resolves.toMatchObject({
          errors: [new GraphQLError('User has not enough GDD')],
        })
      })
      it('logs the error "User has not enough GDD"', () => {
        expect(logErrorLogger.error).toBeCalledWith('User has not enough GDD', expect.any(Number))
      })
    })
  })

  describe('redeemTransactionLink', () => {
    afterAll(async () => {
      await cleanDB()
      resetToken()
    })

    let contributionId: number

    describe('unauthenticated', () => {
      it('throws an error', async () => {
        jest.clearAllMocks()
        resetToken()
        await expect(
          mutate({ mutation: redeemTransactionLink, variables: { code: 'CL-123456' } }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('contributionLink', () => {
        describe('input not valid', () => {
          beforeAll(async () => {
            await mutate({
              mutation: login,
              variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
            })
          })

          it('throws error when link does not exists', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({
                mutation: redeemTransactionLink,
                variables: {
                  code: 'CL-123456',
                },
              }),
            ).resolves.toMatchObject({
              errors: [new GraphQLError('Creation from contribution link was not successful')],
            })
          })

          it('logs the error "No contribution link found to given code"', () => {
            expect(logErrorLogger.error).toBeCalledWith(
              'No contribution link found to given code',
              'CL-123456',
            )
            expect(logErrorLogger.error).toBeCalledWith(
              'Creation from contribution link was not successful',
              new Error('No contribution link found to given code'),
            )
          })

          const now = new Date()
          const validFrom = new Date(now.getFullYear() + 1, 0, 1)

          it('throws error when link is not valid yet', async () => {
            jest.clearAllMocks()
            const {
              data: { createContributionLink: contributionLink },
            } = await mutate({
              mutation: createContributionLink,
              variables: {
                amount: new Decimal(5),
                name: 'Daily Contribution  Link',
                memo: 'Thank you for contribute daily to the community',
                cycle: 'DAILY',
                validFrom: validFrom.toISOString(),
                validTo: new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999).toISOString(),
                maxAmountPerMonth: new Decimal(200),
                maxPerCycle: 1,
              },
            })
            await expect(
              mutate({
                mutation: redeemTransactionLink,
                variables: {
                  code: `CL-${contributionLink.code}`,
                },
              }),
            ).resolves.toMatchObject({
              errors: [new GraphQLError('Creation from contribution link was not successful')],
            })
            await resetEntity(DbContributionLink)
          })

          it('logs the error "Contribution link is not valid yet"', () => {
            expect(logErrorLogger.error).toBeCalledWith(
              'Contribution link is not valid yet',
              validFrom,
            )
            expect(logErrorLogger.error).toBeCalledWith(
              'Creation from contribution link was not successful',
              new Error('Contribution link is not valid yet'),
            )
          })

          it('throws error when contributionLink cycle is invalid', async () => {
            jest.clearAllMocks()
            const now = new Date()
            const {
              data: { createContributionLink: contributionLink },
            } = await mutate({
              mutation: createContributionLink,
              variables: {
                amount: new Decimal(5),
                name: 'Daily Contribution  Link',
                memo: 'Thank you for contribute daily to the community',
                cycle: 'INVALID',
                validFrom: new Date(now.getFullYear(), 0, 1).toISOString(),
                validTo: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString(),
                maxAmountPerMonth: new Decimal(200),
                maxPerCycle: 1,
              },
            })
            await expect(
              mutate({
                mutation: redeemTransactionLink,
                variables: {
                  code: `CL-${contributionLink.code}`,
                },
              }),
            ).resolves.toMatchObject({
              errors: [new GraphQLError('Creation from contribution link was not successful')],
            })
            await resetEntity(DbContributionLink)
          })

          it('logs the error "Contribution link has unknown cycle"', () => {
            expect(logErrorLogger.error).toBeCalledWith(
              'Contribution link has unknown cycle',
              'INVALID',
            )
            expect(logErrorLogger.error).toBeCalledWith(
              'Creation from contribution link was not successful',
              new Error('Contribution link has unknown cycle'),
            )
          })

          const validTo = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 0)
          it('throws error when link is no longer valid', async () => {
            jest.clearAllMocks()
            const {
              data: { createContributionLink: contributionLink },
            } = await mutate({
              mutation: createContributionLink,
              variables: {
                amount: new Decimal(5),
                name: 'Daily Contribution  Link',
                memo: 'Thank you for contribute daily to the community',
                cycle: 'DAILY',
                validFrom: new Date(now.getFullYear() - 1, 0, 1).toISOString(),
                validTo: validTo.toISOString(),
                maxAmountPerMonth: new Decimal(200),
                maxPerCycle: 1,
              },
            })
            await expect(
              mutate({
                mutation: redeemTransactionLink,
                variables: {
                  code: `CL-${contributionLink.code}`,
                },
              }),
            ).resolves.toMatchObject({
              errors: [new GraphQLError('Creation from contribution link was not successful')],
            })
            await resetEntity(DbContributionLink)
          })

          it('logs the error "Contribution link is no longer valid"', () => {
            expect(logErrorLogger.error).toBeCalledWith(
              'Contribution link is no longer valid',
              validTo,
            )
            expect(logErrorLogger.error).toBeCalledWith(
              'Creation from contribution link was not successful',
              new Error('Contribution link is no longer valid'),
            )
          })
        })

        describe('redeem daily Contribution Link', () => {
          const now = new Date()
          let contributionLink: DbContributionLink | undefined
          let contribution: UnconfirmedContribution | undefined

          beforeAll(async () => {
            await mutate({
              mutation: login,
              variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
            })
            await mutate({
              mutation: createContributionLink,
              variables: {
                amount: new Decimal(5),
                name: 'Daily Contribution  Link',
                memo: 'Thank you for contribute daily to the community',
                cycle: 'DAILY',
                validFrom: new Date(now.getFullYear(), 0, 1).toISOString(),
                validTo: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString(),
                maxAmountPerMonth: new Decimal(200),
                maxPerCycle: 1,
              },
            })
          })

          afterAll(async () => {
            await resetEntity(Transaction)
          })

          it('has a daily contribution link in the database', async () => {
            const cls = await DbContributionLink.find()
            expect(cls).toHaveLength(1)
            contributionLink = cls[0]
            expect(contributionLink).toEqual(
              expect.objectContaining({
                id: expect.any(Number),
                name: 'Daily Contribution  Link',
                memo: 'Thank you for contribute daily to the community',
                validFrom: new Date(now.getFullYear(), 0, 1),
                validTo: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 0),
                cycle: 'DAILY',
                maxPerCycle: 1,
                totalMaxCountOfContribution: null,
                maxAccountBalance: null,
                minGapHours: null,
                createdAt: expect.any(Date),
                deletedAt: null,
                code: expect.stringMatching(/^[0-9a-f]{24,24}$/),
                linkEnabled: true,
                amount: expect.decimalEqual(5),
                maxAmountPerMonth: expect.decimalEqual(200),
              }),
            )
          })

          describe('user has pending contribution of 1000 GDD', () => {
            beforeAll(async () => {
              await mutate({
                mutation: login,
                variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
              })
              const result = await mutate({
                mutation: createContribution,
                variables: {
                  amount: new Decimal(1000),
                  memo: 'I was brewing potions for the community the whole month',
                  contributionDate: now.toISOString(),
                },
              })
              contribution = result.data.createContribution
              contributionId = result.data.createContribution.id
            })

            it('does not allow the user to redeem the contribution link', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: redeemTransactionLink,
                  variables: {
                    code: 'CL-' + (contributionLink ? contributionLink.code : ''),
                  },
                }),
              ).resolves.toMatchObject({
                errors: [new GraphQLError('Creation from contribution link was not successful')],
              })
            })

            it('logs the error "Creation from contribution link was not successful"', () => {
              expect(logErrorLogger.error).toBeCalledWith(
                'Creation from contribution link was not successful',
                new Error(
                  'The amount to be created exceeds the amount still available for this month',
                ),
              )
            })
          })

          describe('user has no pending contributions that would not allow to redeem the link', () => {
            beforeAll(async () => {
              await mutate({
                mutation: login,
                variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
              })
              await mutate({
                mutation: updateContribution,
                variables: {
                  contributionId: contribution ? contribution.id : -1,
                  amount: new Decimal(800),
                  memo: 'I was brewing potions for the community the whole month',
                  contributionDate: now.toISOString(),
                },
              })
            })

            it('allows the user to redeem the contribution link', async () => {
              await expect(
                mutate({
                  mutation: redeemTransactionLink,
                  variables: {
                    code: 'CL-' + (contributionLink ? contributionLink.code : ''),
                  },
                }),
              ).resolves.toMatchObject({
                data: {
                  redeemTransactionLink: true,
                },
                errors: undefined,
              })
            })

            it('stores the CONTRIBUTION_LINK_REDEEM event in the database', async () => {
              const userConatct = await UserContact.findOneOrFail({
                where: { email: 'bibi@bloxberg.de' },
                relations: ['user'],
              })
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.CONTRIBUTION_LINK_REDEEM,
                  affectedUserId: userConatct.user.id,
                  actingUserId: userConatct.user.id,
                  involvedTransactionId: expect.any(Number),
                  involvedContributionId: expect.any(Number),
                  involvedContributionLinkId: contributionLink?.id,
                  amount: contributionLink?.amount,
                }),
              )
            })

            it('does not allow the user to redeem the contribution link a second time on the same day', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: redeemTransactionLink,
                  variables: {
                    code: 'CL-' + (contributionLink ? contributionLink.code : ''),
                  },
                }),
              ).resolves.toMatchObject({
                errors: [new GraphQLError('Creation from contribution link was not successful')],
              })
            })

            it('logs the error "Creation from contribution link was not successful"', () => {
              expect(logErrorLogger.error).toBeCalledWith(
                'Creation from contribution link was not successful',
                new Error('Contribution link already redeemed today'),
              )
            })

            describe('after one day', () => {
              beforeAll(async () => {
                jest.useFakeTimers()
                setTimeout(jest.fn(), 1000 * 60 * 60 * 24)
                jest.runAllTimers()
                await mutate({
                  mutation: login,
                  variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
                })
              })

              afterAll(() => {
                jest.useRealTimers()
              })

              it('allows the user to redeem the contribution link again', async () => {
                await expect(
                  mutate({
                    mutation: redeemTransactionLink,
                    variables: {
                      code: 'CL-' + (contributionLink ? contributionLink.code : ''),
                    },
                  }),
                ).resolves.toMatchObject({
                  data: {
                    redeemTransactionLink: true,
                  },
                  errors: undefined,
                })
              })

              it('does not allow the user to redeem the contribution link a second time on the same day', async () => {
                jest.clearAllMocks()
                await expect(
                  mutate({
                    mutation: redeemTransactionLink,
                    variables: {
                      code: 'CL-' + (contributionLink ? contributionLink.code : ''),
                    },
                  }),
                ).resolves.toMatchObject({
                  errors: [new GraphQLError('Creation from contribution link was not successful')],
                })
              })

              it('logs the error "Creation from contribution link was not successful"', () => {
                expect(logErrorLogger.error).toBeCalledWith(
                  'Creation from contribution link was not successful',
                  new Error('Contribution link already redeemed today'),
                )
              })
            })
          })
        })
      })

      describe('transaction link', () => {
        beforeEach(() => {
          jest.clearAllMocks()
        })

        describe('link does not exits', () => {
          beforeAll(async () => {
            await mutate({
              mutation: login,
              variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
            })
          })

          it('throws and logs the error', async () => {
            await expect(
              mutate({
                mutation: redeemTransactionLink,
                variables: {
                  code: 'not-valid',
                },
              }),
            ).resolves.toMatchObject({
              errors: [new GraphQLError('Transaction link not found')],
            })
            expect(logErrorLogger.error).toBeCalledWith('Transaction link not found', 'not-valid')
          })
        })

        describe('link exists', () => {
          let myCode: string
          let myId: number

          beforeAll(async () => {
            await mutate({
              mutation: login,
              variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
            })
            await mutate({
              mutation: confirmContribution,
              variables: { id: contributionId },
            })
            await mutate({
              mutation: login,
              variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
            })
            const {
              data: {
                createTransactionLink: { id, code },
              },
            } = await mutate({
              mutation: createTransactionLink,
              variables: {
                amount: 200,
                memo: 'This is a transaction link from bibi',
              },
            })
            myCode = code
            myId = id
          })

          it('stores the TRANSACTION_LINK_CREATE event in the database', async () => {
            const userConatct = await UserContact.findOneOrFail({
              where: { email: 'bibi@bloxberg.de' },
              relations: ['user'],
            })
            await expect(DbEvent.find()).resolves.toContainEqual(
              expect.objectContaining({
                type: EventType.TRANSACTION_LINK_CREATE,
                affectedUserId: userConatct.user.id,
                actingUserId: userConatct.user.id,
                involvedTransactionLinkId: myId,
                amount: expect.decimalEqual(200),
              }),
            )
          })

          describe('own link', () => {
            beforeAll(async () => {
              await mutate({
                mutation: login,
                variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
              })
            })

            it('throws and logs an error', async () => {
              await expect(
                mutate({
                  mutation: redeemTransactionLink,
                  variables: {
                    code: myCode,
                  },
                }),
              ).resolves.toMatchObject({
                errors: [new GraphQLError('Cannot redeem own transaction link')],
              })
              expect(logErrorLogger.error).toBeCalledWith(
                'Cannot redeem own transaction link',
                expect.any(Number),
              )
            })
            it('delete own link', async () => {
              await expect(
                mutate({
                  mutation: deleteTransactionLink,
                  variables: {
                    id: myId,
                  },
                }),
              ).resolves.toMatchObject({
                data: { deleteTransactionLink: true },
              })
            })

            it('stores the TRANSACTION_LINK_DELETE event in the database', async () => {
              const userConatct = await UserContact.findOneOrFail({
                where: { email: 'bibi@bloxberg.de' },
                relations: ['user'],
              })
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.TRANSACTION_LINK_DELETE,
                  affectedUserId: userConatct.user.id,
                  actingUserId: userConatct.user.id,
                  involvedTransactionLinkId: myId,
                }),
              )
            })
          })

          describe('other link', () => {
            beforeAll(async () => {
              await mutate({
                mutation: login,
                variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
              })
              const {
                data: {
                  createTransactionLink: { id, code },
                },
              } = await mutate({
                mutation: createTransactionLink,
                variables: {
                  amount: 200,
                  memo: 'This is a transaction link from bibi',
                },
              })
              myCode = code
              myId = id
              await mutate({
                mutation: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
            })

            it('successfully redeems link', async () => {
              await expect(
                mutate({
                  mutation: redeemTransactionLink,
                  variables: {
                    code: myCode,
                  },
                }),
              ).resolves.toMatchObject({
                data: { redeemTransactionLink: true },
                errors: undefined,
              })
            })

            it('stores the TRANSACTION_LINK_REDEEM event in the database', async () => {
              const creator = await UserContact.findOneOrFail({
                where: { email: 'bibi@bloxberg.de' },
                relations: ['user'],
              })
              const redeemer = await UserContact.findOneOrFail({
                where: { email: 'peter@lustig.de' },
                relations: ['user'],
              })
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.TRANSACTION_LINK_REDEEM,
                  affectedUserId: redeemer.user.id,
                  actingUserId: redeemer.user.id,
                  involvedUserId: creator.user.id,
                  involvedTransactionLinkId: myId,
                  amount: expect.decimalEqual(200),
                }),
              )
            })
          })
        })
      })
    })
  })

  describe('listTransactionLinksAdmin', () => {
    const variables = {
      userId: 1, // dummy, may be replaced
      filters: null,
      currentPage: 1,
      pageSize: 5,
    }

    afterAll(async () => {
      await cleanDB()
      resetToken()
    })

    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          query({
            query: listTransactionLinksAdmin,
            variables,
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('without admin rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            query({
              query: listTransactionLinksAdmin,
              variables,
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        beforeAll(async () => {
          // admin 'peter@lustig.de' has to exists for 'creationFactory'
          await userFactory(testEnv, peterLustig)

          user = await userFactory(testEnv, bibiBloxberg)
          variables.userId = user.id
          variables.pageSize = 25
          // bibi needs GDDs
          const bibisCreation = creations.find((creation) => creation.email === 'bibi@bloxberg.de')

          await creationFactory(testEnv, bibisCreation!)
          // bibis transaktion links
          const bibisTransaktionLinks = transactionLinks.filter(
            (transactionLink) => transactionLink.email === 'bibi@bloxberg.de',
          )
          for (const bibisTransaktionLink of bibisTransaktionLinks) {
            await transactionLinkFactory(testEnv, bibisTransaktionLink)
          }

          // admin: only now log in
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('', () => {
          it('throws error when user does not exists', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({
                mutation: listTransactionLinksAdmin,
                variables: {
                  userId: -1,
                },
              }),
            ).resolves.toMatchObject({
              errors: [new GraphQLError('Could not find requested User')],
            })
          })

          it('logs the error "Could not find requested User"', () => {
            expect(logErrorLogger.error).toBeCalledWith('Could not find requested User', -1)
          })
        })

        describe('without any filters', () => {
          it('finds 6 open transaction links and no deleted or redeemed', async () => {
            await expect(
              query({
                query: listTransactionLinksAdmin,
                variables,
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listTransactionLinksAdmin: {
                    count: 6,
                    links: expect.not.arrayContaining([
                      expect.objectContaining({
                        memo: 'Leider wollte niemand meine Gradidos zum Neujahr haben :(',
                        createdAt: expect.any(String),
                      }),
                      expect.objectContaining({
                        memo: 'Da habe ich mich wohl etwas übernommen.',
                        deletedAt: expect.any(String),
                      }),
                    ]),
                  },
                },
              }),
            )
          })
        })

        describe('all filters are null', () => {
          it('finds 6 open transaction links and no deleted or redeemed', async () => {
            await expect(
              query({
                query: listTransactionLinksAdmin,
                variables: {
                  ...variables,
                  filters: {
                    withDeleted: null,
                    withExpired: null,
                    withRedeemed: null,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listTransactionLinksAdmin: {
                    count: 6,
                    links: expect.not.arrayContaining([
                      expect.objectContaining({
                        memo: 'Leider wollte niemand meine Gradidos zum Neujahr haben :(',
                        createdAt: expect.any(String),
                      }),
                      expect.objectContaining({
                        memo: 'Da habe ich mich wohl etwas übernommen.',
                        deletedAt: expect.any(String),
                      }),
                    ]),
                  },
                },
              }),
            )
          })
        })

        describe('filter with deleted', () => {
          it('finds 6 open transaction links, 1 deleted, and no redeemed', async () => {
            await expect(
              query({
                query: listTransactionLinksAdmin,
                variables: {
                  ...variables,
                  filters: {
                    withDeleted: true,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listTransactionLinksAdmin: {
                    count: 7,
                    links: expect.arrayContaining([
                      expect.not.objectContaining({
                        memo: 'Leider wollte niemand meine Gradidos zum Neujahr haben :(',
                        createdAt: expect.any(String),
                      }),
                      expect.objectContaining({
                        memo: 'Da habe ich mich wohl etwas übernommen.',
                        deletedAt: expect.any(String),
                      }),
                    ]),
                  },
                },
              }),
            )
          })
        })

        describe('filter by expired', () => {
          it('finds 5 open transaction links, 1 expired, and no redeemed', async () => {
            await expect(
              query({
                query: listTransactionLinksAdmin,
                variables: {
                  ...variables,
                  filters: {
                    withExpired: true,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listTransactionLinksAdmin: {
                    count: 7,
                    links: expect.arrayContaining([
                      expect.objectContaining({
                        memo: 'Leider wollte niemand meine Gradidos zum Neujahr haben :(',
                        createdAt: expect.any(String),
                      }),
                      expect.not.objectContaining({
                        memo: 'Da habe ich mich wohl etwas übernommen.',
                        deletedAt: expect.any(String),
                      }),
                    ]),
                  },
                },
              }),
            )
          })
        })

        // TODO: works not as expected, because 'redeemedAt' and 'redeemedBy' have to be added to the transaktion link factory

        describe.skip('filter by redeemed', () => {
          it('finds 6 open transaction links, 1 deleted, and no redeemed', async () => {
            await expect(
              query({
                query: listTransactionLinksAdmin,
                variables: {
                  ...variables,
                  filters: {
                    withDeleted: null,
                    withExpired: null,
                    withRedeemed: true,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listTransactionLinksAdmin: {
                    count: 6,
                    links: expect.arrayContaining([
                      expect.not.objectContaining({
                        memo: 'Leider wollte niemand meine Gradidos zum Neujahr haben :(',
                        createdAt: expect.any(String),
                      }),
                      expect.objectContaining({
                        memo: 'Yeah, eingelöst!',
                        redeemedAt: expect.any(String),
                        redeemedBy: expect.any(Number),
                      }),
                      expect.not.objectContaining({
                        memo: 'Da habe ich mich wohl etwas übernommen.',
                        deletedAt: expect.any(String),
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
  })

  describe('transactionLinkCode', () => {
    const date = new Date()

    it('returns a string of length 24', () => {
      expect(transactionLinkCode(date)).toHaveLength(24)
    })

    it('returns a string that ends with the hex value of date', () => {
      const regexp = new RegExp(date.getTime().toString(16) + '$')
      expect(transactionLinkCode(date)).toEqual(expect.stringMatching(regexp))
    })
  })
})
