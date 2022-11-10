/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { testEnvironment, resetToken, cleanDB, contributionDateFormatter } from '@test/helpers'
import { logger } from '@test/testSetup'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { User } from '@entity/User'
import { Contribution } from '@entity/Contribution'
import { userFactory } from '@/seeds/factory/user'
import { login, createContribution, adminCreateContribution } from '@/seeds/graphql/mutations'
import { getUserCreation, validateContribution } from './creations'

let mutate: any, query: any, con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  // await cleanDB()
  await con.close()
})

const setZeroHours = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

describe('util/creation', () => {
  let user: User
  let admin: User

  const now = new Date()

  beforeAll(async () => {
    user = await userFactory(testEnv, bibiBloxberg)
    admin = await userFactory(testEnv, peterLustig)
  })

  describe('getUserCreations', () => {
    beforeAll(async () => {
      await mutate({
        mutation: login,
        variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
      })
      await mutate({
        mutation: adminCreateContribution,
        variables: {
          email: 'bibi@bloxberg.de',
          amount: 250.0,
          memo: 'Admin contribution for this month',
          creationDate: contributionDateFormatter(now),
        },
      })
      await mutate({
        mutation: adminCreateContribution,
        variables: {
          email: 'bibi@bloxberg.de',
          amount: 160.0,
          memo: 'Admin contribution for the last month',
          creationDate: contributionDateFormatter(
            new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
          ),
        },
      })
      await mutate({
        mutation: adminCreateContribution,
        variables: {
          email: 'bibi@bloxberg.de',
          amount: 450.0,
          memo: 'Admin contribution for two months ago',
          creationDate: contributionDateFormatter(
            new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()),
          ),
        },
      })
      await mutate({
        mutation: login,
        variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
      })
      await mutate({
        mutation: createContribution,
        variables: {
          amount: 400.0,
          memo: 'Contribution for this month',
          creationDate: contributionDateFormatter(now),
        },
      })
      await mutate({
        mutation: createContribution,
        variables: {
          amount: 500.0,
          memo: 'Contribution for the last month',
          creationDate: contributionDateFormatter(
            new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
          ),
        },
      })
    })

    it('has the correct data setup', async () => {
      await expect(Contribution.find()).resolves.toEqual([
        expect.objectContaining({
          userId: user.id,
          contributionDate: setZeroHours(now),
          amount: expect.decimalEqual(250),
          memo: 'Admin contribution for this month',
          moderatorId: admin.id,
          contributionType: 'ADMIN',
          contributionStatus: 'PENDING',
        }),
        expect.objectContaining({
          userId: user.id,
          contributionDate: setZeroHours(
            new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
          ),
          amount: expect.decimalEqual(160),
          memo: 'Admin contribution for the last month',
          moderatorId: admin.id,
          contributionType: 'ADMIN',
          contributionStatus: 'PENDING',
        }),
        expect.objectContaining({
          userId: user.id,
          contributionDate: setZeroHours(
            new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()),
          ),
          amount: expect.decimalEqual(450),
          memo: 'Admin contribution for two months ago',
          moderatorId: admin.id,
          contributionType: 'ADMIN',
          contributionStatus: 'PENDING',
        }),
        expect.objectContaining({
          userId: user.id,
          contributionDate: setZeroHours(now),
          amount: expect.decimalEqual(400),
          memo: 'Contribution for this month',
          moderatorId: null,
          contributionType: 'USER',
          contributionStatus: 'PENDING',
        }),
        expect.objectContaining({
          userId: user.id,
          contributionDate: setZeroHours(
            new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
          ),
          amount: expect.decimalEqual(500),
          memo: 'Contribution for the last month',
          moderatorId: null,
          contributionType: 'USER',
          contributionStatus: 'PENDING',
        }),
      ])
    })

    describe('call getUserCreation now', () => {
      it('returns the expected open contributions', async () => {
        await expect(getUserCreation(user.id)).resolves.toEqual([
          expect.decimalEqual(550),
          expect.decimalEqual(340),
          expect.decimalEqual(350),
        ])
      })

      describe('run forward in time one hour before next month', () => {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 0, 0)

        beforeAll(() => {
          jest.useFakeTimers()
          /* eslint-disable-next-line @typescript-eslint/no-empty-function */
          setTimeout(() => {}, targetDate.getTime() - now.getTime())
          jest.runAllTimers()
        })

        afterAll(() => {
          jest.useRealTimers()
        })

        it('has the clock set correctly', () => {
          expect(new Date().toISOString()).toContain(
            `${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}T23:`,
          )
        })

        describe('call getUserCreation with UTC', () => {
          it('returns the expected open contributions', async () => {
            await expect(getUserCreation(user.id)).resolves.toEqual([
              expect.decimalEqual(550),
              expect.decimalEqual(340),
              expect.decimalEqual(350),
            ])
          })
        })

        describe('call getUserCreation with JST (GMT+0900)', () => {
          it('returns the expected open contributions', async () => {
            await expect(getUserCreation(user.id, true, -540)).resolves.toEqual([
              expect.decimalEqual(340),
              expect.decimalEqual(350),
              expect.decimalEqual(1000),
            ])
          })
        })

        describe('call getUserCreation with PST (GMT-0800)', () => {
          it('returns the expected open contributions', async () => {
            await expect(getUserCreation(user.id, true, 450)).resolves.toEqual([
              expect.decimalEqual(550),
              expect.decimalEqual(340),
              expect.decimalEqual(350),
            ])
          })
        })

        describe('run two hours forward to be in the next month in UTC', () => {
          const nextMonthTargetDate = new Date()
          nextMonthTargetDate.setTime(targetDate.getTime() + 2 * 60 * 60 * 1000)

          beforeAll(() => {
            /* eslint-disable-next-line @typescript-eslint/no-empty-function */
            setTimeout(() => {}, 2 * 60 * 60 * 1000)
            jest.runAllTimers()
          })

          it('has the clock set correctly', () => {
            expect(new Date().toISOString()).toContain(
              `${nextMonthTargetDate.getFullYear()}-${nextMonthTargetDate.getMonth() + 1}-01T01:`,
            )
          })

          describe('call getUserCreation with UTC', () => {
            it('returns the expected open contributions', async () => {
              await expect(getUserCreation(user.id, true, -540)).resolves.toEqual([
                expect.decimalEqual(340),
                expect.decimalEqual(350),
                expect.decimalEqual(1000),
              ])
            })
          })

          describe('call getUserCreation with JST (GMT+0900)', () => {
            it('returns the expected open contributions', async () => {
              await expect(getUserCreation(user.id, true, -540)).resolves.toEqual([
                expect.decimalEqual(340),
                expect.decimalEqual(350),
                expect.decimalEqual(1000),
              ])
            })
          })

          describe('call getUserCreation with PST (GMT-0800)', () => {
            it('returns the expected open contributions', async () => {
              await expect(getUserCreation(user.id, true, 450)).resolves.toEqual([
                expect.decimalEqual(550),
                expect.decimalEqual(340),
                expect.decimalEqual(350),
              ])
            })
          })
        })
      })
    })
  })
})
