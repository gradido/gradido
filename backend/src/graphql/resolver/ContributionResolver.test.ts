/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import {
  adminUpdateContribution,
  confirmContribution,
  createContribution,
  deleteContribution,
  updateContribution,
  login,
} from '@/seeds/graphql/mutations'
import { listAllContributions, listContributions, verifyLogin } from '@/seeds/graphql/queries'
import {
  addTimezoneHoursToClientRequestTime,
  cleanDB,
  getClientRequestTime,
  getClientRequestTimeAsDate,
  resetClientRequestTime,
  resetToken,
  setClientRequestTime,
  subTimezoneHoursToClientRequestTime,
  testEnvironment,
} from '@test/helpers'
import { GraphQLError } from 'graphql'
import { userFactory } from '@/seeds/factory/user'
import { creationFactory } from '@/seeds/factory/creation'
import { creations } from '@/seeds/creation/index'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { contributionFactory } from '@/seeds/factory/contribution'
import { capturedContribution100OneMonthAgo } from '@/seeds/contribution/capturedContribution100OneMonthAgo'
import { ContributionStatus } from '../enum/ContributionStatus'
import { capturedContribution100TwoMonthAgo } from '@/seeds/contribution/capturedContribution100TwoMonthAgo'
import { EventProtocol } from '@entity/EventProtocol'
import { EventProtocolType } from '@/event/EventProtocolType'
import { logger } from '@test/testSetup'
// eslint-disable-next-line camelcase
import { getDateAs_YYYYMMDD_String, getIsoDateStringAs_YYYYMMDD_String } from '@/util/utilities'

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
        setClientRequestTime(new Date().toISOString())
        await userFactory(testEnv, bibiBloxberg)

        bibi = await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('input not valid', () => {
        let dateStr: string
        it('throws error when memo length smaller than 5 chars', async () => {
          dateStr = getDateAs_YYYYMMDD_String(new Date())
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: 'Test',
                creationDate: dateStr,
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
          dateStr = getDateAs_YYYYMMDD_String(new Date())
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: 'Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test',
                creationDate: dateStr,
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
                // new GraphQLError('No information for available creations for the given date'),
                new GraphQLError(`invalid Date for creationDate=not-valid`),
              ],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith('invalid Date for creationDate=not-valid')
        })

        it('throws error when creationDate 3 month behind', async () => {
          const date = new Date()
          date.setMonth(date.getMonth() - 3)
          dateStr = getDateAs_YYYYMMDD_String(date)
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: 'Test env contribution',
                creationDate: dateStr,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  `It's not allowed to create a contribution with a creationDate=${getIsoDateStringAs_YYYYMMDD_String(
                    dateStr,
                  )} three month before clientRequestTime=${getIsoDateStringAs_YYYYMMDD_String(
                    getClientRequestTime(),
                  )}`,
                ),
              ],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(
            `It's not allowed to create a contribution with a creationDate=${getIsoDateStringAs_YYYYMMDD_String(
              dateStr,
            )} three month before clientRequestTime=${getIsoDateStringAs_YYYYMMDD_String(
              getClientRequestTime(),
            )}`,
          )
        })
      })

      describe('valid input', () => {
        let contribution: any

        beforeAll(async () => {
          contribution = await mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test env contribution',
              creationDate: getDateAs_YYYYMMDD_String(new Date()),
            },
          })
        })

        it('creates contribution', async () => {
          const now = new Date()
          expect(contribution).toEqual(
            expect.objectContaining({
              data: {
                createContribution: {
                  id: expect.any(Number),
                  amount: '100',
                  memo: 'Test env contribution',
                  date: expect.any(String),
                  clientRequestTime: expect.any(String),
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  moderator: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(900),
                      targetMonth: now.getMonth() + 1,
                    }),
                  ]),
                  state: ContributionStatus.PENDING,
                  messageCount: 0,
                },
              },
            }),
          )
        })

        it('stores the create contribution event in the database', async () => {
          await expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.CONTRIBUTION_CREATE,
              amount: expect.decimalEqual(100),
              contributionId: contribution.data.createContribution.id,
              userId: bibi.data.login.id,
            }),
          )
        })
      })
    })

    describe('ClientRequestTime to 1st day of next month ahead server', () => {
      beforeAll(async () => {
        await cleanDB()
        resetToken()

        await userFactory(testEnv, bibiBloxberg)
        // create one contribution with 100GDD for bibi one month ago in the past
        await contributionFactory(testEnv, bibiBloxberg, capturedContribution100OneMonthAgo)
        // set clientRequestTime at the 1st day of the next month against the backend time
        const clientRequestTime = new Date()
        clientRequestTime.setDate(1)
        clientRequestTime.setMonth(clientRequestTime.getMonth() + 1)
        clientRequestTime.setHours(12)
        setClientRequestTime(clientRequestTime.toISOString()) // , 'Europe/Berlin')
        addTimezoneHoursToClientRequestTime(5)
      })
      describe('authenticated with valid user', () => {
        beforeAll(async () => {
          jest.clearAllMocks()
          await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
          resetClientRequestTime()
        })

        it('verify limits before 1st creation', async () => {
          await expect(query({ query: verifyLogin })).resolves.toEqual(
            expect.objectContaining({
              data: {
                verifyLogin: {
                  emailContact: {
                    email: 'bibi@bloxberg.de',
                  },
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  language: 'de',
                  klickTipp: {
                    newsletterState: false,
                  },
                  hasElopage: false,
                  publisherId: 1234,
                  isAdmin: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: getClientRequestTimeAsDate().getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(900),
                      targetMonth: getClientRequestTimeAsDate().getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: getClientRequestTimeAsDate().getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: getClientRequestTimeAsDate().getMonth() + 1,
                    }),
                  ]),
                },
              },
            }),
          )
        })

        it('1st contribution creation ahead server time', async () => {
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 600.0,
                memo: '1st new contribution one month ahead server time',
                creationDate: getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                createContribution: {
                  id: expect.any(Number),
                  amount: '600',
                  memo: '1st new contribution one month ahead server time',
                  date: expect.any(String),
                  clientRequestTime: getClientRequestTime(),
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  moderator: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: getClientRequestTimeAsDate().getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(900),
                      targetMonth: getClientRequestTimeAsDate().getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: getClientRequestTimeAsDate().getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(400),
                      targetMonth: getClientRequestTimeAsDate().getMonth() + 1,
                    }),
                  ]),
                  state: ContributionStatus.PENDING,
                  messageCount: 0,
                },
              },
            }),
          )
        })

        it('two creations and update to exceed limit', async () => {
          result = await mutate({
            mutation: createContribution,
            variables: {
              amount: 50.0,
              memo: '2nd new contribution one month ahead server time',
              creationDate: getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
            },
          })
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: '3rd new contribution one month ahead server time',
                creationDate: getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                createContribution: {
                  id: expect.any(Number),
                  amount: '100',
                  memo: '3rd new contribution one month ahead server time',
                  date: new Date(
                    getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
                  ).toISOString(),
                  clientRequestTime: getClientRequestTime(),
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  moderator: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: getClientRequestTimeAsDate().getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(900),
                      targetMonth: getClientRequestTimeAsDate().getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: getClientRequestTimeAsDate().getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(250),
                      targetMonth: getClientRequestTimeAsDate().getMonth() + 1,
                    }),
                  ]),
                  state: ContributionStatus.PENDING,
                  messageCount: 0,
                },
              },
            }),
          )

          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 400.0,
                memo: 'update 2nd contribution one month ahead server time',
                creationDate: getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'The amount (400 GDD) to be created exceeds the amount (300 GDD) still available for this month.',
                ),
              ],
            }),
          )
        })
      })
    })

    describe('ClientRequestTime to 28th of month behind server', () => {
      beforeAll(async () => {
        await cleanDB()
        resetToken()

        await userFactory(testEnv, bibiBloxberg)
        // create one contribution with 100GDD for bibi one month ago in the past
        await contributionFactory(testEnv, bibiBloxberg, capturedContribution100OneMonthAgo)
        // set clientRequestTime at the 28th of the previous month against the backend time
        const clientRequestTime = new Date()
        // its easier to use 28th than calculating for each month the last day of month
        clientRequestTime.setDate(28)
        clientRequestTime.setMonth(clientRequestTime.getMonth() - 1)
        setClientRequestTime(clientRequestTime.toISOString()) // , 'Europe/Berlin')
        subTimezoneHoursToClientRequestTime(5)
      })
      describe('authenticated with valid user', () => {
        beforeAll(async () => {
          jest.clearAllMocks()
          await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
          resetClientRequestTime()
        })

        it('verify limits before 1st creation', async () => {
          const now = new Date()
          // expect creation months from server time, which is ahead of the clientRequest Time
          await expect(query({ query: verifyLogin })).resolves.toEqual(
            expect.objectContaining({
              data: {
                verifyLogin: {
                  emailContact: {
                    email: 'bibi@bloxberg.de',
                  },
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  language: 'de',
                  klickTipp: {
                    newsletterState: false,
                  },
                  hasElopage: false,
                  publisherId: 1234,
                  isAdmin: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(900),
                      targetMonth: now.getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() + 1,
                    }),
                  ]),
                },
              },
            }),
          )
        })

        it('1st contribution creation behind server time', async () => {
          const now = new Date()
          // expect creation months from server time, which is ahead of the clientRequest Time
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 600.0,
                memo: '1st new contribution one month behind server time',
                creationDate: getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                createContribution: {
                  id: expect.any(Number),
                  amount: '600',
                  memo: '1st new contribution one month behind server time',
                  // date: expect.any(String),
                  date: new Date(
                    getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
                  ).toISOString(),
                  clientRequestTime: getClientRequestTime(),
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  moderator: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(300),
                      targetMonth: now.getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() + 1,
                    }),
                  ]),
                  state: ContributionStatus.PENDING,
                  messageCount: 0,
                },
              },
            }),
          )
        })

        it('two creations and update to exceed limit', async () => {
          const now = new Date()
          // expect creation months from server time, which is ahead of the clientRequest Time
          result = await mutate({
            mutation: createContribution,
            variables: {
              amount: 50.0,
              memo: '2nd new contribution one month behind server time',
              creationDate: getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
            },
          })
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: '3rd new contribution one month behind server time',
                creationDate: getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                createContribution: {
                  id: expect.any(Number),
                  amount: '100',
                  memo: '3rd new contribution one month behind server time',
                  // date: expect.any(String),
                  date: new Date(
                    getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
                  ).toISOString(),
                  clientRequestTime: getClientRequestTime(),
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  moderator: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(150),
                      targetMonth: now.getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() + 1,
                    }),
                  ]),
                  state: ContributionStatus.PENDING,
                  messageCount: 0,
                },
              },
            }),
          )

          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 400.0,
                memo: 'update 2nd contribution one month behind server time',
                creationDate: getIsoDateStringAs_YYYYMMDD_String(getClientRequestTime()),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'The amount (400 GDD) to be created exceeds the amount (200 GDD) still available for this month.',
                ),
              ],
            }),
          )
        })
      })
    })

    describe('ClientRequestTime 1 month and contribution 2 month behind server', () => {
      beforeAll(async () => {
        await cleanDB()
        resetToken()

        await userFactory(testEnv, bibiBloxberg)
        // create one contribution with 100GDD for bibi one month ago in the past
        await contributionFactory(testEnv, bibiBloxberg, capturedContribution100TwoMonthAgo)
        // set clientRequestTime at the 28th of the previous month against the backend time
        const clientRequestTime = new Date()
        // its easier to use 28th than calculating for each month the last day of month
        clientRequestTime.setDate(28)
        clientRequestTime.setMonth(clientRequestTime.getMonth() - 1)
        setClientRequestTime(clientRequestTime.toISOString()) // , 'Europe/Berlin')
      })
      describe('authenticated with valid user', () => {
        const creationDate = new Date()
        creationDate.setMonth(creationDate.getMonth() - 2)

        beforeAll(async () => {
          jest.clearAllMocks()
          await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
          resetClientRequestTime()
        })

        it('verify limits before 1st creation', async () => {
          const now = new Date()
          // expect creation months from server time, which is ahead of the clientRequest Time
          await expect(query({ query: verifyLogin })).resolves.toEqual(
            expect.objectContaining({
              data: {
                verifyLogin: {
                  emailContact: {
                    email: 'bibi@bloxberg.de',
                  },
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  language: 'de',
                  klickTipp: {
                    newsletterState: false,
                  },
                  hasElopage: false,
                  publisherId: 1234,
                  isAdmin: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(900),
                      targetMonth: now.getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() + 1,
                    }),
                  ]),
                },
              },
            }),
          )
        })

        it('1st contribution creation 2 month behind server time', async () => {
          const now = new Date()
          // expect creation months from server time, which is ahead of the clientRequest Time
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 600.0,
                memo: '1st new contribution one month behind server time',
                creationDate: getDateAs_YYYYMMDD_String(creationDate),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                createContribution: {
                  id: expect.any(Number),
                  amount: '600',
                  memo: '1st new contribution one month behind server time',
                  date: new Date(getDateAs_YYYYMMDD_String(creationDate)).toISOString(),
                  clientRequestTime: getClientRequestTime(),
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  moderator: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(300),
                      targetMonth: now.getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() + 1,
                    }),
                  ]),
                  state: ContributionStatus.PENDING,
                  messageCount: 0,
                },
              },
            }),
          )
        })

        it('two creations and update to exceed limit', async () => {
          const now = new Date()
          // expect creation months from server time, which is ahead of the clientRequest Time
          result = await mutate({
            mutation: createContribution,
            variables: {
              amount: 50.0,
              memo: '2nd new contribution one month ahead server time',
              creationDate: getDateAs_YYYYMMDD_String(creationDate),
            },
          })
          await expect(
            mutate({
              mutation: createContribution,
              variables: {
                amount: 100.0,
                memo: '3rd new contribution one month ahead server time',
                creationDate: getDateAs_YYYYMMDD_String(creationDate),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              data: {
                createContribution: {
                  id: expect.any(Number),
                  amount: '100',
                  memo: '3rd new contribution one month ahead server time',
                  date: new Date(getDateAs_YYYYMMDD_String(creationDate)).toISOString(),
                  clientRequestTime: getClientRequestTime(),
                  firstName: 'Bibi',
                  lastName: 'Bloxberg',
                  moderator: null,
                  creation: expect.arrayContaining([
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() - 3 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(150),
                      targetMonth: now.getMonth() - 2 + 1,
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth(),
                    }),
                    expect.objectContaining({
                      amount: expect.decimalEqual(1000),
                      targetMonth: now.getMonth() + 1,
                    }),
                  ]),
                  state: ContributionStatus.PENDING,
                  messageCount: 0,
                },
              },
            }),
          )

          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 400.0,
                memo: 'update 2nd contribution two month behind server time',
                creationDate: getDateAs_YYYYMMDD_String(creationDate),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'The amount (400 GDD) to be created exceeds the amount (200 GDD) still available for this month.',
                ),
              ],
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
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test env contribution',
            creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        result = await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test env contribution',
            creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
                creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
                creationDate: getDateAs_YYYYMMDD_String(date),
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
                creationDate: getDateAs_YYYYMMDD_String(date),
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
          await mutate({
            mutation: login,
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
                creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
                creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
          await mutate({
            mutation: login,
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
                creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
          date.setMonth(date.getMonth() - 3)
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: result.data.createContribution.id,
                amount: 10.0,
                memo: 'Test env contribution',
                creationDate: getDateAs_YYYYMMDD_String(date),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError('Currently the month of the contribution cannot be changed.'),
              ],
            }),
          )
        })

        it('logs the error found', () => {
          expect(logger.error).toBeCalledWith(
            'No information for available creations with the given creationDate=',
            'Invalid Date',
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
                creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
          bibi = await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })

          await expect(EventProtocol.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventProtocolType.CONTRIBUTION_UPDATE,
              amount: expect.decimalEqual(10),
              contributionId: result.data.createContribution.id,
              userId: bibi.data.login.id,
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
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test env contribution',
            creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
      let peter: any
      beforeAll(async () => {
        await userFactory(testEnv, bibiBloxberg)
        peter = await userFactory(testEnv, peterLustig)

        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
        result = await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: 'Test env contribution',
            creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
          await mutate({
            mutation: login,
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
              creationDate: getDateAs_YYYYMMDD_String(new Date()),
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
              amount: expect.decimalEqual(166),
              userId: peter.id,
            }),
          )
        })
      })

      describe('User deletes already confirmed contribution', () => {
        it('throws an error', async () => {
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
          await mutate({
            mutation: confirmContribution,
            variables: {
              id: result.data.createContribution.id,
            },
          })
          await mutate({
            mutation: login,
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
