/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { transactionLinkCode } from './TransactionLinkResolver'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { cleanDB, testEnvironment } from '@test/helpers'
import { userFactory } from '@/seeds/factory/user'
import { login, createContributionLink, redeemTransactionLink } from '@/seeds/graphql/mutations'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import Decimal from 'decimal.js-light'
import { GraphQLError } from 'graphql'

let mutate: any, con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
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
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
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
