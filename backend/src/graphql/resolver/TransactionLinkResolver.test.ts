/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { transactionLinkCode } from './TransactionLinkResolver'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { cleanDB, testEnvironment, resetToken } from '@test/helpers'
import { creationFactory } from '@/seeds/factory/creation'
import { creations } from '@/seeds/creation/index'
import { userFactory } from '@/seeds/factory/user'
import { transactionLinkFactory } from '@/seeds/factory/transactionLink'
import { transactionLinks } from '@/seeds/transactionLink/index'
import {
  login,
  createContributionLink,
  deleteContributionLink,
  updateContributionLink,
  redeemTransactionLink,
  createContribution,
  updateContribution,
} from '@/seeds/graphql/mutations'
import { listTransactionLinksAdmin, listContributionLinks } from '@/seeds/graphql/queries'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { User } from '@entity/User'
import { UnconfirmedContribution } from '@model/UnconfirmedContribution'
import Decimal from 'decimal.js-light'
import { GraphQLError } from 'graphql'
import { logger } from '@test/testSetup'

let mutate: any, query: any, con: any
let testEnv: any

let user: User
let admin: User

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
        await expect(
          mutate({
            mutation: redeemTransactionLink,
            variables: {
              code: 'CL-' + (contributionLink ? contributionLink.code : ''),
            },
          }),
        ).resolves.toMatchObject({
          errors: [
            new GraphQLError(
              'Creation from contribution link was not successful. Error: The amount (5 GDD) to be created exceeds the amount (0 GDD) still available for this month.',
            ),
          ],
        })
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
        await expect(
          mutate({
            mutation: redeemTransactionLink,
            variables: {
              code: 'CL-' + (contributionLink ? contributionLink.code : ''),
            },
          }),
        ).resolves.toMatchObject({
          errors: [
            new GraphQLError(
              'Creation from contribution link was not successful. Error: Contribution link already redeemed today',
            ),
          ],
        })
      })

      describe('after one day', () => {
        beforeAll(async () => {
          jest.useFakeTimers()
          /* eslint-disable-next-line @typescript-eslint/no-empty-function */
          setTimeout(() => {}, 1000 * 60 * 60 * 24)
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
          await expect(
            mutate({
              mutation: redeemTransactionLink,
              variables: {
                code: 'CL-' + (contributionLink ? contributionLink.code : ''),
              },
            }),
          ).resolves.toMatchObject({
            errors: [
              new GraphQLError(
                'Creation from contribution link was not successful. Error: Contribution link already redeemed today',
              ),
            ],
          })
        })
      })
    })
  })

  describe('transaction links list', () => {
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
          admin = await userFactory(testEnv, peterLustig)

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
          user = await userFactory(testEnv, peterLustig)
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
                errors: [
                  new GraphQLError('Start-Date is not initialized. A Start-Date must be set!'),
                ],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              'Start-Date is not initialized. A Start-Date must be set!',
            )
          })

          it('returns an error if missing endDate', async () => {
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
                errors: [new GraphQLError('End-Date is not initialized. An End-Date must be set!')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              'End-Date is not initialized. An End-Date must be set!',
            )
          })

          it('returns an error if endDate is before startDate', async () => {
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
                  new GraphQLError(`The value of validFrom must before or equals the validTo!`),
                ],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              `The value of validFrom must before or equals the validTo!`,
            )
          })

          it('returns an error if name is an empty string', async () => {
            await expect(
              mutate({
                mutation: createContributionLink,
                variables: {
                  ...variables,
                  name: '',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('The name must be initialized!')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith('The name must be initialized!')
          })

          it('returns an error if name is shorter than 5 characters', async () => {
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
                errors: [
                  new GraphQLError(
                    `The value of 'name' with a length of 3 did not fulfill the requested bounderies min=5 and max=100`,
                  ),
                ],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              `The value of 'name' with a length of 3 did not fulfill the requested bounderies min=5 and max=100`,
            )
          })

          it('returns an error if name is longer than 100 characters', async () => {
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
                errors: [
                  new GraphQLError(
                    `The value of 'name' with a length of 101 did not fulfill the requested bounderies min=5 and max=100`,
                  ),
                ],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              `The value of 'name' with a length of 101 did not fulfill the requested bounderies min=5 and max=100`,
            )
          })

          it('returns an error if memo is an empty string', async () => {
            await expect(
              mutate({
                mutation: createContributionLink,
                variables: {
                  ...variables,
                  memo: '',
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('The memo must be initialized!')],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith('The memo must be initialized!')
          })

          it('returns an error if memo is shorter than 5 characters', async () => {
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
                errors: [
                  new GraphQLError(
                    `The value of 'memo' with a length of 3 did not fulfill the requested bounderies min=5 and max=255`,
                  ),
                ],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              `The value of 'memo' with a length of 3 did not fulfill the requested bounderies min=5 and max=255`,
            )
          })

          it('returns an error if memo is longer than 255 characters', async () => {
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
                errors: [
                  new GraphQLError(
                    `The value of 'memo' with a length of 256 did not fulfill the requested bounderies min=5 and max=255`,
                  ),
                ],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              `The value of 'memo' with a length of 256 did not fulfill the requested bounderies min=5 and max=255`,
            )
          })

          it('returns an error if amount is not positive', async () => {
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
                errors: [
                  new GraphQLError('The amount=0 must be initialized with a positiv value!'),
                ],
              }),
            )
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith(
              'The amount=0 must be initialized with a positiv value!',
            )
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
                  errors: [new GraphQLError('Contribution Link not found to given id.')],
                }),
              )
            })
          })

          it('logs the error thrown', () => {
            expect(logger.error).toBeCalledWith('Contribution Link not found to given id: -1')
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
                  errors: [new GraphQLError('Contribution Link not found to given id.')],
                }),
              )
            })

            it('logs the error thrown', () => {
              expect(logger.error).toBeCalledWith('Contribution Link not found to given id: -1')
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
                    deleteContributionLink: expect.any(String),
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
