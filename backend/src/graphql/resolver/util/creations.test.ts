import { cleanDB, contributionDateFormatter, testEnvironment } from '@test/helpers'
import { ApolloServerTestClient } from 'apollo-server-testing'
import { AppDatabase, Contribution, User } from 'database'

import { CONFIG } from '@/config'
import { userFactory } from '@/seeds/factory/user'
import { adminCreateContribution, createContribution, login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

import { getOpenCreations, getUserCreation } from './creations'

jest.mock('@/password/EncryptorUtils')

CONFIG.HUMHUB_ACTIVE = false

let mutate: ApolloServerTestClient['mutate']
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  db: AppDatabase
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  db = testEnv.db
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await db.destroy()
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
            new Date(now.getFullYear(), now.getMonth() - 1, 1),
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
            new Date(now.getFullYear(), now.getMonth() - 2, 1),
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
          contributionDate: contributionDateFormatter(now),
        },
      })
      await mutate({
        mutation: createContribution,
        variables: {
          amount: 500.0,
          memo: 'Contribution for the last month',
          contributionDate: contributionDateFormatter(
            new Date(now.getFullYear(), now.getMonth() - 1, 1),
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
          contributionDate: setZeroHours(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
          amount: expect.decimalEqual(160),
          memo: 'Admin contribution for the last month',
          moderatorId: admin.id,
          contributionType: 'ADMIN',
          contributionStatus: 'PENDING',
        }),
        expect.objectContaining({
          userId: user.id,
          contributionDate: setZeroHours(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
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
          contributionDate: setZeroHours(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
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
        await expect(getUserCreation(user.id, 0)).resolves.toEqual([
          expect.decimalEqual(550),
          expect.decimalEqual(340),
          expect.decimalEqual(350),
        ])
      })

      describe('run forward in time one hour before next month', () => {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 0, 0)

        beforeAll(() => {
          const halfMsToRun = (targetDate.getTime() - now.getTime()) / 2
          jest.useFakeTimers()
          setTimeout(jest.fn(), halfMsToRun)
          jest.runAllTimers()
          setTimeout(jest.fn(), halfMsToRun)
          jest.runAllTimers()
        })

        afterAll(() => {
          jest.useRealTimers()
        })

        it('has the clock set correctly', () => {
          const targetMonthString =
            (targetDate.getMonth() + 1 < 10 ? '0' : '') + String(targetDate.getMonth() + 1)
          expect(new Date().toISOString()).toContain(
            `${targetDate.getFullYear()}-${targetMonthString}-${targetDate.getDate()}T23:`,
          )
        })

        describe('call getUserCreation with UTC', () => {
          it('returns the expected open contributions', async () => {
            await expect(getUserCreation(user.id, 0)).resolves.toEqual([
              expect.decimalEqual(550),
              expect.decimalEqual(340),
              expect.decimalEqual(350),
            ])
          })
        })

        describe('call getUserCreation with JST (GMT+0900)', () => {
          it('returns the expected open contributions', async () => {
            await expect(getUserCreation(user.id, -540, true)).resolves.toEqual([
              expect.decimalEqual(340),
              expect.decimalEqual(350),
              expect.decimalEqual(1000),
            ])
          })
        })

        describe('call getUserCreation with PST (GMT-0800)', () => {
          it('returns the expected open contributions', async () => {
            await expect(getUserCreation(user.id, 480, true)).resolves.toEqual([
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
            setTimeout(jest.fn(), 2 * 60 * 60 * 1000)
            jest.runAllTimers()
          })

          it('has the clock set correctly', () => {
            const targetMonth = nextMonthTargetDate.getMonth() + 1
            const targetMonthString = (targetMonth < 10 ? '0' : '') + String(targetMonth)
            expect(new Date().toISOString()).toContain(
              `${nextMonthTargetDate.getFullYear()}-${targetMonthString}-01T01:`,
            )
          })

          describe('call getUserCreation with UTC', () => {
            it('returns the expected open contributions', async () => {
              await expect(getUserCreation(user.id, 0, true)).resolves.toEqual([
                expect.decimalEqual(340),
                expect.decimalEqual(350),
                expect.decimalEqual(1000),
              ])
            })
          })

          describe('call getUserCreation with JST (GMT+0900)', () => {
            it('returns the expected open contributions', async () => {
              await expect(getUserCreation(user.id, -540, true)).resolves.toEqual([
                expect.decimalEqual(340),
                expect.decimalEqual(350),
                expect.decimalEqual(1000),
              ])
            })
          })

          describe('call getUserCreation with PST (GMT-0800)', () => {
            it('returns the expected open contributions', async () => {
              await expect(getUserCreation(user.id, 450, true)).resolves.toEqual([
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

  describe('getOpenCreations', () => {
    beforeAll(() => {
      // enable Fake timers
      jest.useFakeTimers()
      // jest.setSystemTime(new Date('2022-01-01T00:00:00Z'))
    })

    afterAll(() => {
      // disable Fake timers and set time back to system time
      jest.useRealTimers()
    })
    it('test default case', async () => {
      jest.setSystemTime(new Date('2022-01-10T00:00:00Z'))
      const creationDates = await getOpenCreations(user.id, 0)
      expect(creationDates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ month: 10 }),
          expect.objectContaining({ month: 11 }),
          expect.objectContaining({ month: 0 }),
        ]),
      )
    })
    it('test edge case with february', async () => {
      jest.setSystemTime(new Date('2022-05-31T00:00:00Z'))
      const creationDates = await getOpenCreations(user.id, 0)
      expect(creationDates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ month: 2 }),
          expect.objectContaining({ month: 3 }),
          expect.objectContaining({ month: 4 }),
        ]),
      )
    })
    it('test edge case with july', async () => {
      jest.setSystemTime(new Date('2022-07-31T00:00:00Z'))
      const creationDates = await getOpenCreations(user.id, 0)
      expect(creationDates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ month: 4 }),
          expect.objectContaining({ month: 5 }),
          expect.objectContaining({ month: 6 }),
        ]),
      )
    })
  })
})
