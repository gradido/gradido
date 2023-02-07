/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { transactionLinkCode } from './TransactionLinkResolver'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { cleanDB, testEnvironment, resetToken, resetEntity } from '@test/helpers'
import { creationFactory } from '@/seeds/factory/creation'
import { creations } from '@/seeds/creation/index'
import { userFactory } from '@/seeds/factory/user'
import { transactionLinkFactory } from '@/seeds/factory/transactionLink'
import { transactionLinks } from '@/seeds/transactionLink/index'
import {
  login,
  createContributionLink,
  redeemTransactionLink,
  createContribution,
  updateContribution,
  createTransactionLink,
} from '@/seeds/graphql/mutations'
import { listTransactionLinksAdmin } from '@/seeds/graphql/queries'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { User } from '@entity/User'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import Decimal from 'decimal.js-light'
import { GraphQLError } from 'graphql'
import { TRANSACTIONS_LOCK } from '@/util/TRANSACTIONS_LOCK'
import { logger } from '@test/testSetup'

// mock semaphore to allow use fake timers
jest.mock('@/util/TRANSACTIONS_LOCK')
TRANSACTIONS_LOCK.acquire = jest.fn().mockResolvedValue(jest.fn())

let mutate: any, query: any, con: any
let testEnv: any

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
  await con.close()
})

describe('TransactionLinkResolver', () => {
  describe('createTransactionLink', () => {
    beforeAll(async () => {
      await mutate({
        mutation: login,
        variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
      })
    })

    it('throws error when amount is zero', async () => {
      jest.clearAllMocks()
      await expect(
        mutate({
          mutation: createTransactionLink,
          variables: {
            amount: 0,
            memo: 'Test',
          },
        }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('Amount must be a positive number')],
      })
    })
    it('logs the error thrown', () => {
      expect(logger.error).toBeCalledWith('Amount must be a positive number', new Decimal(0))
    })

    it('throws error when amount is negative', async () => {
      jest.clearAllMocks()
      await expect(
        mutate({
          mutation: createTransactionLink,
          variables: {
            amount: -10,
            memo: 'Test',
          },
        }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('Amount must be a positive number')],
      })
    })
    it('logs the error thrown', () => {
      expect(logger.error).toBeCalledWith('Amount must be a positive number', new Decimal(-10))
    })

    it('throws error when user has not enough GDD', async () => {
      jest.clearAllMocks()
      await expect(
        mutate({
          mutation: createTransactionLink,
          variables: {
            amount: 1001,
            memo: 'Test',
          },
        }),
      ).resolves.toMatchObject({
        errors: [new GraphQLError('User has not enough GDD')],
      })
    })
    it('logs the error thrown', () => {
      expect(logger.error).toBeCalledWith('User has not enough GDD', expect.any(Number))
    })
  })

  describe('redeemTransactionLink', () => {
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

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith(
            'No contribution link found to given code',
            'CL-123456',
          )
          expect(logger.error).toBeCalledWith(
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
                code: 'CL-' + contributionLink.code,
              },
            }),
          ).resolves.toMatchObject({
            errors: [new GraphQLError('Creation from contribution link was not successful')],
          })
          await resetEntity(DbContributionLink)
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('Contribution link is not valid yet', validFrom)
          expect(logger.error).toBeCalledWith(
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
                code: 'CL-' + contributionLink.code,
              },
            }),
          ).resolves.toMatchObject({
            errors: [new GraphQLError('Creation from contribution link was not successful')],
          })
          await resetEntity(DbContributionLink)
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('Contribution link has unknown cycle', 'INVALID')
          expect(logger.error).toBeCalledWith(
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
                code: 'CL-' + contributionLink.code,
              },
            }),
          ).resolves.toMatchObject({
            errors: [new GraphQLError('Creation from contribution link was not successful')],
          })
          await resetEntity(DbContributionLink)
        })

        it('logs the error thrown', () => {
          expect(logger.error).toBeCalledWith('Contribution link is no longer valid', validTo)
          expect(logger.error).toBeCalledWith(
            'Creation from contribution link was not successful',
            new Error('Contribution link is no longer valid'),
          )
        })
      })

      // TODO: have this test separated into a transactionLink and a contributionLink part
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
                creationDate: now.toISOString(),
              },
            })
            contribution = result.data.createContribution
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

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              'Creation from contribution link was not successful',
              new Error(
                'The amount (5 GDD) to be created exceeds the amount (0 GDD) still available for this month.',
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
                creationDate: now.toISOString(),
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

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
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

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith(
                'Creation from contribution link was not successful',
                new Error('Contribution link already redeemed today'),
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

    // TODO: there is a test not cleaning up after itself! Fix it!
    beforeAll(async () => {
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          await creationFactory(testEnv, bibisCreation!)
          // bibis transaktion links
          const bibisTransaktionLinks = transactionLinks.filter(
            (transactionLink) => transactionLink.email === 'bibi@bloxberg.de',
          )
          for (let i = 0; i < bibisTransaktionLinks.length; i++) {
            await transactionLinkFactory(testEnv, bibisTransaktionLinks[i])
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
                    linkCount: 6,
                    linkList: expect.not.arrayContaining([
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
                    linkCount: 6,
                    linkList: expect.not.arrayContaining([
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
                    linkCount: 7,
                    linkList: expect.arrayContaining([
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
                    linkCount: 7,
                    linkList: expect.arrayContaining([
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
                    linkCount: 6,
                    linkList: expect.arrayContaining([
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
