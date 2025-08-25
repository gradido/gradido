import { ApolloServerTestClient } from 'apollo-server-testing'
import { Contribution, Event as DbEvent, Transaction as DbTransaction, User } from 'database'
import { Decimal } from 'decimal.js-light'
import { GraphQLError } from 'graphql'
import { DataSource, Equal } from 'typeorm'

import { ContributionMessageType } from '@enum/ContributionMessageType'
import { ContributionStatus } from '@enum/ContributionStatus'
import { Order } from '@enum/Order'
import {
  cleanDB,
  contributionDateFormatter,
  resetEntity,
  resetToken,
  testEnvironment,
} from '@test/helpers'
import { i18n as localization } from '@test/testSetup'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  sendContributionConfirmedEmail,
  sendContributionDeletedEmail,
  sendContributionDeniedEmail,
} from '@/emails/sendEmailVariants'
import { EventType } from '@/event/Events'
import { creations } from '@/seeds/creation/index'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import {
  adminCreateContribution,
  adminCreateContributionMessage,
  adminDeleteContribution,
  adminUpdateContribution,
  confirmContribution,
  createContribution,
  deleteContribution,
  denyContribution,
  login,
  logout,
  updateContribution,
} from '@/seeds/graphql/mutations'
import {
  adminListContributions,
  listAllContributions,
  listContributions,
} from '@/seeds/graphql/queries'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { raeuberHotzenplotz } from '@/seeds/users/raeuber-hotzenplotz'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { getFirstDayOfPreviousNMonth } from 'core'
import { getLogger } from 'config-schema/test/testSetup'
import { getLogger as originalGetLogger } from 'log4js'

jest.mock('@/emails/sendEmailVariants')
jest.mock('@/password/EncryptorUtils')

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.server.LogError`)

let mutate: ApolloServerTestClient['mutate']
let query: ApolloServerTestClient['query']
let con: DataSource
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
}
let creation: Contribution | null
let admin: User
let pendingContribution: any
let inProgressContribution: any
let contributionToConfirm: any
let contributionToDeny: any
let contributionToDelete: any
let bibiCreatedContribution: Contribution

beforeAll(async () => {
  testEnv = await testEnvironment(originalGetLogger('apollo'), localization)
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.destroy()
})

describe('ContributionResolver', () => {
  let bibi: any

  beforeAll(async () => {
    bibi = await userFactory(testEnv, bibiBloxberg)
    admin = await userFactory(testEnv, peterLustig)
    await userFactory(testEnv, raeuberHotzenplotz)
    const bibisCreation = creations.find((creation) => creation.email === 'bibi@bloxberg.de')

    bibiCreatedContribution = await creationFactory(testEnv, bibisCreation!)
    await mutate({
      mutation: login,
      variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
    })
    pendingContribution = await mutate({
      mutation: createContribution,
      variables: {
        amount: 100.0,
        memo: 'Test PENDING contribution',
        contributionDate: new Date().toString(),
      },
    })
    inProgressContribution = await mutate({
      mutation: createContribution,
      variables: {
        amount: 100.0,
        memo: 'Test IN_PROGRESS contribution',
        contributionDate: new Date().toString(),
      },
    })
    contributionToConfirm = await mutate({
      mutation: createContribution,
      variables: {
        amount: 100.0,
        memo: 'Test contribution to confirm',
        contributionDate: new Date().toString(),
      },
    })
    contributionToDeny = await mutate({
      mutation: createContribution,
      variables: {
        amount: 100.0,
        memo: 'Test contribution to deny',
        contributionDate: new Date().toString(),
      },
    })
    contributionToDelete = await mutate({
      mutation: createContribution,
      variables: {
        amount: 100.0,
        memo: 'Test contribution to delete',
        contributionDate: new Date().toString(),
      },
    })
    await mutate({
      mutation: login,
      variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
    })
    await mutate({
      mutation: adminCreateContributionMessage,
      variables: {
        contributionId: inProgressContribution.data.createContribution.id,
        message: 'Test message to IN_PROGRESS contribution',
      },
    })
    await mutate({
      mutation: adminCreateContributionMessage,
      variables: {
        contributionId: pendingContribution.data.createContribution.id,
        message: 'Test moderator message',
        messageType: ContributionMessageType.MODERATOR,
      },
    })
    await mutate({
      mutation: logout,
    })
    resetToken()
  })

  afterAll(async () => {
    await cleanDB()
    resetToken()
  })

  describe('createContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        const { errors: errorObjects } = await mutate({
          mutation: createContribution,
          variables: { amount: 100.0, memo: 'Test Contribution', contributionDate: 'not-valid' },
        })

        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated with valid user', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('input not valid', () => {
        it('throws error when memo length smaller than 5 chars', async () => {
          jest.clearAllMocks()
          const date = new Date()

          const { errors: errorObjects } = await mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test',
              contributionDate: date.toString(),
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

        it('throws error when memo length greater than 512 chars', async () => {
          jest.clearAllMocks()
          const date = new Date()
          const { errors: errorObjects } = await mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test',
              contributionDate: date.toString(),
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

        it('throws error when creationDate not-valid', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test env contribution',
              contributionDate: 'not-valid',
            },
          })
          expect(errorObjects).toMatchObject([
            {
              message: 'Argument Validation Error',
              extensions: {
                exception: {
                  validationErrors: [
                    {
                      property: 'contributionDate',
                      constraints: {
                        isValidDateString:
                          'contributionDate must be a valid date string, contributionDate',
                      },
                    },
                  ],
                },
              },
            },
          ])
        })

        it('throws error when creationDate 3 month behind', async () => {
          jest.clearAllMocks()
          const date = getFirstDayOfPreviousNMonth(new Date(), 3)
          const { errors: errorObjects } = await mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test env contribution',
              contributionDate: date.toString(),
            },
          })
          expect(errorObjects).toEqual([
            new GraphQLError('No information for available creations for the given date'),
          ])
        })

        it('logs the error "No information for available creations for the given date" again', () => {
          expect(logger.error).toBeCalledWith(
            'No information for available creations for the given date',
            expect.any(Date),
          )
        })
      })

      describe('valid input', () => {
        it('creates contribution', () => {
          expect(pendingContribution.data.createContribution).toMatchObject({
            id: expect.any(Number),
            amount: '100',
            memo: 'Test PENDING contribution',
          })
        })

        it('stores the CONTRIBUTION_CREATE event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.CONTRIBUTION_CREATE,
              affectedUserId: bibi.id,
              actingUserId: bibi.id,
              involvedContributionId: pendingContribution.data.createContribution.id,
              amount: expect.decimalEqual(100),
            }),
          )
        })
      })
    })
  })

  describe('updateContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        const { errors: errorObjects } = await mutate({
          mutation: updateContribution,
          variables: {
            contributionId: 1,
            amount: 100.0,
            memo: 'Test Contribution',
            contributionDate: 'not-valid',
          },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('Memo length smaller than 5 chars', () => {
        it('throws error', async () => {
          jest.clearAllMocks()
          const date = new Date()
          const { errors: errorObjects } = await mutate({
            mutation: updateContribution,
            variables: {
              contributionId: pendingContribution.data.createContribution.id,
              amount: 100.0,
              memo: 'Test',
              contributionDate: date.toString(),
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
      })

      describe('Memo length greater than 512 chars', () => {
        it('throws error', async () => {
          jest.clearAllMocks()
          const date = new Date()
          const { errors: errorObjects } = await mutate({
            mutation: updateContribution,
            variables: {
              contributionId: pendingContribution.data.createContribution.id,
              amount: 100.0,
              memo: 'Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test Test',
              contributionDate: date.toString(),
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
      })

      describe('wrong contribution id', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          await expect(
            mutate({
              mutation: updateContribution,
              variables: {
                contributionId: -1,
                amount: 100.0,
                memo: 'Test env contribution',
                contributionDate: new Date().toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('Contribution not found')],
            }),
          )
        })

        it('logs the error "Contribution not found"', () => {
          expect(logger.error).toBeCalledWith('Contribution not found', -1)
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
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: updateContribution,
            variables: {
              contributionId: pendingContribution.data.createContribution.id,
              amount: 10.0,
              memo: 'Test env contribution',
              contributionDate: new Date().toString(),
            },
          })
          expect(errorObjects).toEqual([
            new GraphQLError('Can not update contribution of another user'),
          ])
        })

        it('logs the error "Can not update contribution of another user"', () => {
          expect(logger.error).toBeCalledWith(
            'Can not update contribution of another user',
            expect.any(Object),
            expect.any(Number),
          )
        })
      })

      describe('admin tries to update a user contribution', () => {
        beforeAll(async () => {
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        describe('contribution has wrong status', () => {
          beforeAll(async () => {
            const contribution = await Contribution.findOneOrFail({
              where: { id: pendingContribution.data.createContribution.id },
            })
            contribution.contributionStatus = ContributionStatus.DELETED
            await contribution.save()
            await mutate({
              mutation: login,
              variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
            })
          })

          afterAll(async () => {
            const contribution = await Contribution.findOneOrFail({
              where: { id: pendingContribution.data.createContribution.id },
            })
            contribution.contributionStatus = ContributionStatus.PENDING
            await contribution.save()
          })

          it('throws an error', async () => {
            jest.clearAllMocks()
            await expect(
              mutate({
                mutation: updateContribution,
                variables: {
                  contributionId: pendingContribution.data.createContribution.id,
                  amount: 10.0,
                  memo: 'Test env contribution',
                  contributionDate: new Date().toString(),
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Contribution can not be updated due to status')],
              }),
            )
          })

          it('logs the error "Contribution can not be updated due to status"', () => {
            expect(logger.error).toBeCalledWith(
              'Contribution can not be updated due to status',
              ContributionStatus.DELETED,
            )
          })
        })
      })

      describe('update too much so that the limit is exceeded', () => {
        beforeAll(async () => {
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        it('throws an error', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: updateContribution,
            variables: {
              contributionId: pendingContribution.data.createContribution.id,
              amount: 1019.0,
              memo: 'Test env contribution',
              contributionDate: new Date().toString(),
            },
          })
          expect(errorObjects).toEqual([
            new GraphQLError(
              'The amount to be created exceeds the amount still available for this month',
            ),
          ])
        })

        it('logs the error "The amount to be created exceeds the amount still available for this month"', () => {
          expect(logger.error).toBeCalledWith(
            'The amount to be created exceeds the amount still available for this month',
            new Decimal(1019),
            new Decimal(600),
          )
        })
      })

      describe('update creation to a date that is older than 3 months', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          const date = getFirstDayOfPreviousNMonth(new Date(), 3)
          const { errors: errorObjects } = await mutate({
            mutation: updateContribution,
            variables: {
              contributionId: pendingContribution.data.createContribution.id,
              amount: 10.0,
              memo: 'Test env contribution',
              contributionDate: date.toString(),
            },
          })
          expect(errorObjects).toEqual([
            new GraphQLError('Month of contribution can not be changed'),
          ])
        })

        it('logs the error "Month of contribution can not be changed"', () => {
          expect(logger.error).toBeCalledWith('Month of contribution can not be changed')
        })
      })

      describe('valid input', () => {
        it('updates contribution', async () => {
          const {
            data: { updateContribution: contribution },
          } = await mutate({
            mutation: updateContribution,
            variables: {
              contributionId: pendingContribution.data.createContribution.id,
              amount: 10.0,
              memo: 'Test PENDING contribution update',
              contributionDate: new Date().toString(),
            },
          })
          expect(contribution).toMatchObject({
            id: pendingContribution.data.createContribution.id,
            amount: '10',
            memo: 'Test PENDING contribution update',
          })
        })

        it('stores the CONTRIBUTION_UPDATE event in the database', async () => {
          await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })

          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.CONTRIBUTION_UPDATE,
              affectedUserId: bibi.id,
              actingUserId: bibi.id,
              involvedContributionId: pendingContribution.data.createContribution.id,
              amount: expect.decimalEqual(10),
            }),
          )
        })
      })
    })
  })

  describe('denyContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        const { errors: errorObjects } = await mutate({
          mutation: denyContribution,
          variables: {
            id: 1,
          },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated without admin rights', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      it('returns an error', async () => {
        const { errors: errorObjects } = await mutate({
          mutation: denyContribution,
          variables: {
            id: 1,
          },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated with admin rights', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('wrong contribution id', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: denyContribution,
            variables: {
              id: -1,
            },
          })
          expect(errorObjects).toEqual([new GraphQLError('Contribution not found')])
        })

        it('logs the error "Contribution not found"', () => {
          expect(logger.error).toBeCalledWith('Contribution not found', -1)
        })
      })

      describe('deny contribution that is already confirmed', () => {
        let contribution: any
        it('throws an error', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'raeuber@hotzenplotz.de', password: 'Aa12345_' },
          })

          contribution = await mutate({
            mutation: createContribution,
            variables: {
              amount: 166.0,
              memo: 'Whatever contribution',
              contributionDate: new Date().toString(),
            },
          })

          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })

          await mutate({
            mutation: confirmContribution,
            variables: {
              id: contribution.data.createContribution.id,
            },
          })

          const { errors: errorObjects } = await mutate({
            mutation: denyContribution,
            variables: {
              id: contribution.data.createContribution.id,
            },
          })
          expect(errorObjects).toEqual([new GraphQLError('Contribution not found')])
        })

        it('logs the error "Contribution not found"', () => {
          expect(logger.error).toBeCalledWith('Contribution not found', expect.any(Number))
        })
      })

      describe('deny contribution that is already deleted', () => {
        let contribution: any

        it('throws an error', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'raeuber@hotzenplotz.de', password: 'Aa12345_' },
          })

          contribution = await mutate({
            mutation: createContribution,
            variables: {
              amount: 166.0,
              memo: 'Whatever contribution',
              contributionDate: new Date().toString(),
            },
          })

          await mutate({
            mutation: deleteContribution,
            variables: {
              id: contribution.data.createContribution.id,
            },
          })

          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })

          const { errors: errorObjects } = await mutate({
            mutation: denyContribution,
            variables: {
              id: contribution.data.createContribution.id,
            },
          })
          expect(errorObjects).toEqual([new GraphQLError('Contribution not found')])
        })

        it('logs the error "Contribution not found"', () => {
          expect(logger.error).toBeCalledWith(`Contribution not found`, expect.any(Number))
        })
      })

      describe('deny contribution that is already denied', () => {
        let contribution: any

        it('throws an error', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'raeuber@hotzenplotz.de', password: 'Aa12345_' },
          })

          contribution = await mutate({
            mutation: createContribution,
            variables: {
              amount: 166.0,
              memo: 'Whatever contribution',
              contributionDate: new Date().toString(),
            },
          })

          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })

          await mutate({
            mutation: denyContribution,
            variables: {
              id: contribution.data.createContribution.id,
            },
          })

          const { errors: errorObjects } = await mutate({
            mutation: denyContribution,
            variables: {
              id: contribution.data.createContribution.id,
            },
          })
          expect(errorObjects).toEqual([new GraphQLError('Contribution not found')])
        })

        it('logs the error "Contribution not found"', () => {
          expect(logger.error).toBeCalledWith(`Contribution not found`, expect.any(Number))
        })
      })

      describe('valid input', () => {
        it('deny contribution', async () => {
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
          const {
            data: { denyContribution: isDenied },
          } = await mutate({
            mutation: denyContribution,
            variables: {
              id: contributionToDeny.data.createContribution.id,
            },
          })
          expect(isDenied).toBe(true)
        })

        it('stores the ADMIN_CONTRIBUTION_DENY event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.ADMIN_CONTRIBUTION_DENY,
              affectedUserId: bibi.id,
              actingUserId: admin.id,
              involvedContributionId: contributionToDeny.data.createContribution.id,
              amount: expect.decimalEqual(100),
            }),
          )
        })

        it('calls sendContributionDeniedEmail', () => {
          expect(sendContributionDeniedEmail).toBeCalledWith({
            firstName: 'Bibi',
            lastName: 'Bloxberg',
            email: 'bibi@bloxberg.de',
            language: 'de',
            senderFirstName: 'Peter',
            senderLastName: 'Lustig',
            contributionMemo: 'Test contribution to deny',
            contributionFrontendLink: `http://localhost/contributions/own-contributions/1#contributionListItem-${contributionToDeny.data.createContribution.id}`,
          })
        })
      })
    })
  })

  describe('deleteContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        const { errors: errorObjects } = await mutate({
          mutation: deleteContribution,
          variables: {
            id: -1,
          },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('wrong contribution id', () => {
        it('returns an error', async () => {
          jest.clearAllMocks()
          const { errors: errorObjects } = await mutate({
            mutation: deleteContribution,
            variables: {
              id: -1,
            },
          })
          expect(errorObjects).toEqual([new GraphQLError('Contribution not found')])
        })

        it('logs the error "Contribution not found"', () => {
          expect(logger.error).toBeCalledWith('Contribution not found', expect.any(Number))
        })
      })

      describe('other user sends a deleteContribution', () => {
        beforeAll(async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(() => {
          resetToken()
        })

        it('returns an error', async () => {
          const { errors: errorObjects } = await mutate({
            mutation: deleteContribution,
            variables: {
              id: contributionToDelete.data.createContribution.id,
            },
          })
          expect(errorObjects).toEqual([
            new GraphQLError('Can not delete contribution of another user'),
          ])
        })

        it('logs the error "Can not delete contribution of another user"', () => {
          expect(logger.error).toBeCalledWith(
            'Can not delete contribution of another user',
            expect.any(Contribution),
            expect.any(Number),
          )
        })
      })

      describe('User deletes own contribution', () => {
        beforeAll(async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(() => {
          resetToken()
        })

        it('deletes successfully', async () => {
          const {
            data: { deleteContribution: isDenied },
          } = await mutate({
            mutation: deleteContribution,
            variables: {
              id: contributionToDelete.data.createContribution.id,
            },
          })
          expect(isDenied).toBe(true)
        })

        it('stores the CONTRIBUTION_DELETE event in the database', async () => {
          await expect(DbEvent.find()).resolves.toContainEqual(
            expect.objectContaining({
              type: EventType.CONTRIBUTION_DELETE,
              affectedUserId: bibi.id,
              actingUserId: bibi.id,
              involvedContributionId: contributionToDelete.data.createContribution.id,
              amount: expect.decimalEqual(100),
            }),
          )
        })
      })

      describe('User deletes already confirmed contribution', () => {
        it('throws an error', async () => {
          jest.clearAllMocks()
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
          await mutate({
            mutation: confirmContribution,
            variables: {
              id: contributionToConfirm.data.createContribution.id,
            },
          })
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
          const { errors: errorObjects } = await mutate({
            mutation: deleteContribution,
            variables: {
              id: contributionToConfirm.data.createContribution.id,
            },
          })
          expect(errorObjects).toEqual([
            new GraphQLError('A confirmed contribution can not be deleted'),
          ])
        })

        it('logs the error "A confirmed contribution can not be deleted"', () => {
          expect(logger.error).toBeCalledWith(
            'A confirmed contribution can not be deleted',
            expect.objectContaining({ contributionStatus: 'CONFIRMED' }),
          )
        })
      })
    })
  })

  describe('listContributions', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        const { errors: errorObjects } = await query({
          query: listContributions,
          variables: {
            pagination: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
            },
          },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      describe('no status filter', () => {
        it('returns creations', async () => {
          const {
            data: { listContributions: contributionListResult },
          } = await query({
            query: listContributions,
            variables: {
              pagination: {
                currentPage: 1,
                pageSize: 25,
                order: 'DESC',
              },
            },
          })
          expect(contributionListResult).toMatchObject({
            contributionCount: 6,
            contributionList: expect.arrayContaining([
              expect.objectContaining({
                amount: '100',
                id: contributionToConfirm.data.createContribution.id,
                memo: 'Test contribution to confirm',
                messagesCount: 0,
              }),
              expect.objectContaining({
                id: pendingContribution.data.createContribution.id,
                memo: 'Test PENDING contribution update',
                amount: '10',
                messagesCount: 1,
              }),
              expect.objectContaining({
                id: contributionToDeny.data.createContribution.id,
                memo: 'Test contribution to deny',
                amount: '100',
                messagesCount: 0,
              }),
              expect.objectContaining({
                id: contributionToDelete.data.createContribution.id,
                memo: 'Test contribution to delete',
                amount: '100',
                messagesCount: 0,
              }),
              expect.objectContaining({
                id: inProgressContribution.data.createContribution.id,
                memo: 'Test IN_PROGRESS contribution',
                amount: '100',
                messagesCount: 1,
              }),
              expect.objectContaining({
                id: bibiCreatedContribution.id,
                memo: 'Herzlich Willkommen bei Gradido!',
                amount: '1000',
                messagesCount: 0,
              }),
            ]),
          })
          expect(contributionListResult.contributionList).toHaveLength(6)
        })
      })
    })
  })

  describe('listAllContribution', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        const { errors: errorObjects } = await query({
          query: listAllContributions,
          variables: {
            pagination: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
            },
          },
        })
        expect(errorObjects).toEqual([new GraphQLError('401 Unauthorized')])
      })
    })

    describe('authenticated', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      it('returns all contributions without statusFilter', async () => {
        const {
          data: { listAllContributions: contributionListObject },
        } = await query({
          query: listAllContributions,
          variables: {
            pagination: {
              currentPage: 1,
              pageSize: 25,
              order: 'DESC',
            },
          },
        })
        expect(contributionListObject).toMatchObject({
          contributionCount: 7,
          contributionList: expect.arrayContaining([
            expect.not.objectContaining({
              contributionStatus: 'DELETED',
            }),
            expect.objectContaining({
              amount: '100',
              contributionStatus: 'CONFIRMED',
              id: contributionToConfirm.data.createContribution.id,
              memo: 'Test contribution to confirm',
              messagesCount: 0,
            }),
            expect.objectContaining({
              id: pendingContribution.data.createContribution.id,
              contributionStatus: 'PENDING',
              memo: 'Test PENDING contribution update',
              amount: '10',
              messagesCount: 0,
            }),
            expect.objectContaining({
              id: contributionToDeny.data.createContribution.id,
              contributionStatus: 'DENIED',
              memo: 'Test contribution to deny',
              amount: '100',
              messagesCount: 0,
            }),
            expect.objectContaining({
              id: inProgressContribution.data.createContribution.id,
              contributionStatus: 'IN_PROGRESS',
              memo: 'Test IN_PROGRESS contribution',
              amount: '100',
              messagesCount: 0,
            }),
            expect.objectContaining({
              id: bibiCreatedContribution.id,
              contributionStatus: 'CONFIRMED',
              memo: 'Herzlich Willkommen bei Gradido!',
              amount: '1000',
              messagesCount: 0,
            }),
            expect.objectContaining({
              id: expect.any(Number),
              contributionStatus: 'CONFIRMED',
              memo: 'Whatever contribution',
              amount: '166',
              messagesCount: 0,
            }),
            expect.objectContaining({
              id: expect.any(Number),
              contributionStatus: 'DENIED',
              memo: 'Whatever contribution',
              amount: '166',
              messagesCount: 0,
            }),
          ]),
        })
        expect(contributionListObject.contributionList).toHaveLength(7)
      })
    })
  })

  describe('contributions', () => {
    const variables = {
      email: 'bibi@bloxberg.de',
      amount: new Decimal(2000),
      memo: 'Aktives Grundeinkommen',
      creationDate: 'not-valid',
    }

    describe('unauthenticated', () => {
      describe('adminCreateContribution', () => {
        it('returns an error', async () => {
          await expect(mutate({ mutation: adminCreateContribution, variables })).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('adminUpdateContribution', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: adminUpdateContribution,
              variables: {
                id: 1,
                amount: new Decimal(300),
                memo: 'Danke Bibi!',
                creationDate: contributionDateFormatter(new Date()),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('adminDeleteContribution', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: adminDeleteContribution,
              variables: {
                id: 1,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('confirmContribution', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: confirmContribution,
              variables: {
                id: 1,
              },
            }),
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
          await mutate({
            mutation: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(() => {
          resetToken()
        })

        describe('adminCreateContribution', () => {
          it('returns an error', async () => {
            await expect(mutate({ mutation: adminCreateContribution, variables })).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('adminUpdateContribution', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: adminUpdateContribution,
                variables: {
                  id: 1,
                  amount: new Decimal(300),
                  memo: 'Danke Bibi!',
                  creationDate: contributionDateFormatter(new Date()),
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('adminDeleteContribution', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: adminDeleteContribution,
                variables: {
                  id: 1,
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('confirmContribution', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: confirmContribution,
                variables: {
                  id: 1,
                },
              }),
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
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(() => {
          resetToken()
        })

        describe('adminCreateContribution', () => {
          const now = new Date()

          beforeAll(async () => {
            await mutate({
              mutation: adminCreateContribution,
              variables: {
                email: 'peter@lustig.de',
                amount: 400,
                memo: 'Herzlich Willkommen bei Gradido!',
                creationDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 1, 1),
                ),
              },
            })
            creation = await Contribution.findOneOrFail({
              where: {
                memo: 'Herzlich Willkommen bei Gradido!',
                amount: Equal(new Decimal('400')),
              },
            })
          })

          describe('user to create for does not exist', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              variables.email = 'some@fake.email'
              variables.creationDate = contributionDateFormatter(
                new Date(now.getFullYear(), now.getMonth() - 1, 1),
              )
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Could not find user')],
                }),
              )
            })

            it('logs the error "Could not find user"', () => {
              expect(logger.error).toBeCalledWith('Could not find user', 'some@fake.email')
            })
          })

          describe('user to create for is deleted', () => {
            beforeAll(async () => {
              await userFactory(testEnv, stephenHawking)
              variables.email = 'stephen@hawking.uk'
              variables.creationDate = contributionDateFormatter(
                new Date(now.getFullYear(), now.getMonth() - 1, 1),
              )
            })

            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError('Cannot create contribution since the user was deleted'),
                  ],
                }),
              )
            })

            it('logs the error "Cannot create contribution since the user was deleted"', () => {
              expect(logger.error).toBeCalledWith(
                'Cannot create contribution since the user was deleted',
                expect.objectContaining({
                  user: expect.objectContaining({
                    deletedAt: new Date('2018-03-14T09:17:52.000Z'),
                  }),
                }),
              )
            })
          })

          describe('user to create for has email not confirmed', () => {
            beforeAll(async () => {
              await userFactory(testEnv, garrickOllivander)
              variables.email = 'garrick@ollivander.com'
              variables.creationDate = contributionDateFormatter(
                new Date(now.getFullYear(), now.getMonth() - 1, 1),
              )
            })

            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError(
                      'Cannot create contribution since the users email is not activated',
                    ),
                  ],
                }),
              )
            })

            it('logs the error "Cannot create contribution since the users email is not activated"', () => {
              expect(logger.error).toBeCalledWith(
                'Cannot create contribution since the users email is not activated',
                expect.objectContaining({ emailChecked: false }),
              )
            })
          })

          describe('valid user to create for', () => {
            beforeAll(() => {
              variables.email = 'bibi@bloxberg.de'
              variables.creationDate = 'invalid-date'
            })

            describe('date of creation is not a date string', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                const { errors: errorObjects } = await mutate({
                  mutation: adminCreateContribution,
                  variables,
                })
                expect(errorObjects).toMatchObject([
                  {
                    message: 'Argument Validation Error',
                    extensions: {
                      exception: {
                        validationErrors: [
                          {
                            property: 'creationDate',
                            constraints: {
                              isValidDateString:
                                'creationDate must be a valid date string, creationDate',
                            },
                          },
                        ],
                      },
                    },
                  },
                ])
              })
            })

            describe('date of creation is four months ago', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                variables.creationDate = contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 4, 1),
                )
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError('No information for available creations for the given date'),
                    ],
                  }),
                )
              })

              it('logs the error "No information for available creations for the given date"', () => {
                expect(logger.error).toBeCalledWith(
                  'No information for available creations for the given date',
                  new Date(variables.creationDate),
                )
              })
            })

            describe('date of creation is in the future', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                variables.creationDate = contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() + 4, 1),
                )
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError('No information for available creations for the given date'),
                    ],
                  }),
                )
              })

              it('logs the error "No information for available creations for the given date"', () => {
                expect(logger.error).toBeCalledWith(
                  'No information for available creations for the given date',
                  new Date(variables.creationDate),
                )
              })
            })

            describe('amount of creation is too high', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                variables.creationDate = contributionDateFormatter(now)
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError(
                        'The amount to be created exceeds the amount still available for this month',
                      ),
                    ],
                  }),
                )
              })

              it('logs the error "The amount to be created exceeds the amount still available for this month"', () => {
                expect(logger.error).toBeCalledWith(
                  'The amount to be created exceeds the amount still available for this month',
                  new Decimal(2000),
                  new Decimal(790),
                )
              })
            })

            describe('creation is valid', () => {
              it('returns an array of the open creations for the last three months', async () => {
                variables.amount = new Decimal(200)
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    data: {
                      adminCreateContribution: ['1000', '1000', '590'],
                    },
                  }),
                )
              })

              it('stores the ADMIN_CONTRIBUTION_CREATE event in the database', async () => {
                await expect(DbEvent.find()).resolves.toContainEqual(
                  expect.objectContaining({
                    type: EventType.ADMIN_CONTRIBUTION_CREATE,
                    affectedUserId: bibi.id,
                    actingUserId: admin.id,
                    amount: expect.decimalEqual(200),
                  }),
                )
              })

              describe('user tries to update admin contribution', () => {
                beforeAll(async () => {
                  await mutate({
                    mutation: login,
                    variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
                  })
                })

                afterAll(async () => {
                  await mutate({
                    mutation: login,
                    variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
                  })
                })

                it('logs and throws "Cannot update contribution of moderator" error', async () => {
                  jest.clearAllMocks()
                  const adminContribution = await Contribution.findOne({
                    where: {
                      moderatorId: admin.id,
                      userId: bibi.id,
                    },
                  })
                  await expect(
                    mutate({
                      mutation: updateContribution,
                      variables: {
                        contributionId: adminContribution?.id ?? -1,
                        amount: 100.0,
                        memo: 'Test Test Test',
                        contributionDate: new Date().toString(),
                      },
                    }),
                  ).resolves.toMatchObject({
                    errors: [new GraphQLError('Cannot update contribution of moderator')],
                  })
                  expect(logger.error).toBeCalledWith(
                    'Cannot update contribution of moderator',
                    expect.any(Object),
                    bibi.id,
                  )
                })
              })
            })

            describe('second creation surpasses the available amount ', () => {
              it('returns an array of the open creations for the last three months', async () => {
                jest.clearAllMocks()
                variables.amount = new Decimal(1000)
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError(
                        'The amount to be created exceeds the amount still available for this month',
                      ),
                    ],
                  }),
                )
              })

              it('logs the error "The amount to be created exceeds the amount still available for this month"', () => {
                expect(logger.error).toBeCalledWith(
                  'The amount to be created exceeds the amount still available for this month',
                  new Decimal(1000),
                  new Decimal(590),
                )
              })
            })
          })
        })

        describe('adminUpdateContribution', () => {
          // at this point we have this data in DB:
          // bibi@bloxberg.de: [1000, 1000, 800]
          // peter@lustig.de: [1000, 600, 1000]
          // stephen@hawking.uk: [1000, 1000, 1000] - deleted
          // garrick@ollivander.com: [1000, 1000, 1000] - not activated

          describe('creation does not exist', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: 728,
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Contribution not found')],
                }),
              )
            })

            it('logs the error "Contribution not found"', () => {
              expect(logger.error).toBeCalledWith('Contribution not found', 728)
            })
          })

          describe('creation update is not valid', () => {
            // as this test has not clearly defined that date, it is a false positive
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                    amount: new Decimal(1900),
                    memo: 'Danke Peter!',
                    creationDate: creation
                      ? contributionDateFormatter(creation.contributionDate)
                      : contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError(
                      'The amount to be created exceeds the amount still available for this month',
                    ),
                  ],
                }),
              )
            })

            it('logs the error "The amount to be created exceeds the amount still available for this month"', () => {
              expect(logger.error).toBeCalledWith(
                'The amount to be created exceeds the amount still available for this month',
                new Decimal(1900),
                new Decimal(1000),
              )
            })
          })

          describe.skip('creation update is successful changing month', () => {
            // skipped as changing the month is currently disable
            it('returns update creation object', async () => {
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: creation?.id,
                    amount: new Decimal(300),
                    memo: 'Danke Peter!',
                    creationDate: creation
                      ? contributionDateFormatter(creation.contributionDate)
                      : contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: {
                    adminUpdateContribution: {
                      date: expect.any(String),
                      memo: 'Danke Peter!',
                      amount: '300',
                    },
                  },
                }),
              )
            })

            it('stores the ADMIN_CONTRIBUTION_UPDATE event in the database', async () => {
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.ADMIN_CONTRIBUTION_UPDATE,
                  affectedUserId: creation?.userId,
                  actingUserId: admin.id,
                  amount: 300,
                }),
              )
            })
          })

          describe('creation update is successful without changing month', () => {
            // actually this mutation IS changing the month
            it('returns update creation object', async () => {
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
                  variables: {
                    id: creation?.id,
                    amount: new Decimal(200),
                    memo: 'Das war leider zu Viel!',
                    creationDate: creation
                      ? contributionDateFormatter(creation.contributionDate)
                      : contributionDateFormatter(new Date()),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: {
                    adminUpdateContribution: {
                      date: expect.any(String),
                      memo: 'Das war leider zu Viel!',
                      amount: '200',
                    },
                  },
                }),
              )
            })

            it('stores the ADMIN_CONTRIBUTION_UPDATE event in the database', async () => {
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.ADMIN_CONTRIBUTION_UPDATE,
                  affectedUserId: creation?.userId,
                  actingUserId: admin.id,
                  amount: expect.decimalEqual(200),
                }),
              )
            })
          })
        })

        describe('adminDeleteContribution', () => {
          describe('creation id does not exist', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Contribution not found')],
                }),
              )
            })

            it('logs the error "Contribution not found"', () => {
              expect(logger.error).toBeCalledWith('Contribution not found', -1)
            })
          })

          describe('admin deletes own user contribution', () => {
            let ownContribution: any
            beforeAll(async () => {
              await query({
                query: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
              ownContribution = await mutate({
                mutation: createContribution,
                variables: {
                  amount: 100.0,
                  memo: 'Test env contribution',
                  contributionDate: contributionDateFormatter(new Date()),
                },
              })
            })

            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: ownContribution.data.createContribution.id,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Own contribution can not be deleted as admin')],
                }),
              )
            })
          })

          describe('creation id does exist', () => {
            it('returns true', async () => {
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: creation?.id,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { adminDeleteContribution: true },
                }),
              )
            })

            it('stores the ADMIN_CONTRIBUTION_DELETE event in the database', async () => {
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.ADMIN_CONTRIBUTION_DELETE,
                  affectedUserId: creation?.userId,
                  actingUserId: admin.id,
                  involvedContributionId: creation?.id,
                  amount: expect.decimalEqual(200),
                }),
              )
            })

            it('calls sendContributionDeletedEmail', () => {
              expect(sendContributionDeletedEmail).toBeCalledWith({
                firstName: 'Peter',
                lastName: 'Lustig',
                email: 'peter@lustig.de',
                language: 'de',
                senderFirstName: 'Peter',
                senderLastName: 'Lustig',
                contributionMemo: 'Das war leider zu Viel!',
                contributionFrontendLink: `http://localhost/contributions/own-contributions/1#contributionListItem-${creation?.id}`,
              })
            })
          })

          describe('creation already confirmed', () => {
            it('throws an error', async () => {
              await userFactory(testEnv, bobBaumeister)
              await query({
                query: login,
                variables: { email: 'bob@baumeister.de', password: 'Aa12345_' },
              })
              const {
                data: { createContribution: confirmedContribution },
              } = await mutate({
                mutation: createContribution,
                variables: {
                  amount: 100.0,
                  memo: 'Confirmed Contribution',
                  contributionDate: contributionDateFormatter(new Date()),
                },
              })
              await query({
                query: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
              await mutate({
                mutation: confirmContribution,
                variables: {
                  id: confirmedContribution.id ? confirmedContribution.id : -1,
                },
              })
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: confirmedContribution.id ? confirmedContribution.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('A confirmed contribution can not be deleted')],
                }),
              )
              await resetEntity(DbTransaction)
            })
          })
        })

        describe('confirmContribution', () => {
          describe('creation does not exits', () => {
            it('throws an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: confirmContribution,
                  variables: {
                    id: -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Contribution not found')],
                }),
              )
            })

            it('logs the error "Contribution not found"', () => {
              expect(logger.error).toBeCalledWith('Contribution not found', -1)
            })
          })

          describe('confirm own creation', () => {
            beforeAll(async () => {
              const now = new Date()
              creation = await creationFactory(testEnv, {
                email: 'peter@lustig.de',
                amount: 400,
                memo: 'Herzlich Willkommen bei Gradido!',
                contributionDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 1, 1),
                ),
              })
            })

            it('thows an error', async () => {
              jest.clearAllMocks()
              await expect(
                mutate({
                  mutation: confirmContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Moderator can not confirm own contribution')],
                }),
              )
            })

            it('logs the error "Moderator can not confirm own contribution"', () => {
              expect(logger.error).toBeCalledWith('Moderator can not confirm own contribution')
            })
          })

          describe('confirm creation for other user', () => {
            beforeAll(async () => {
              const now = new Date()
              creation = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 450,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                contributionDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 2, 1),
                ),
              })
              await query({
                query: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
            })

            it('returns true', async () => {
              await expect(
                mutate({
                  mutation: confirmContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { confirmContribution: true },
                }),
              )
            })

            it('stores the ADMIN_CONTRIBUTION_CONFIRM event in the database', async () => {
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.ADMIN_CONTRIBUTION_CONFIRM,
                }),
              )
            })

            it('creates a transaction', async () => {
              const transaction = await DbTransaction.find()
              expect(transaction[0].amount.toString()).toBe('450')
              expect(transaction[0].memo).toBe('Herzlich Willkommen bei Gradido liebe Bibi!')
              expect(transaction[0].linkedTransactionId).toEqual(null)
              expect(transaction[0].transactionLinkId).toEqual(null)
              expect(transaction[0].previous).toEqual(null)
              expect(transaction[0].linkedUserId).toEqual(admin.id)
              expect(transaction[0].typeId).toEqual(1)
            })

            it('calls sendContributionConfirmedEmail', () => {
              expect(sendContributionConfirmedEmail).toBeCalledWith({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                email: 'bibi@bloxberg.de',
                language: 'de',
                senderFirstName: 'Peter',
                senderLastName: 'Lustig',
                contributionMemo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                contributionAmount: expect.decimalEqual(450),
                contributionFrontendLink: `http://localhost/contributions/own-contributions/1#contributionListItem-${creation?.id}`,
              })
            })

            it('stores the EMAIL_CONFIRMATION event in the database', async () => {
              await expect(DbEvent.find()).resolves.toContainEqual(
                expect.objectContaining({
                  type: EventType.EMAIL_CONFIRMATION,
                }),
              )
            })

            describe('confirm same contribution again', () => {
              it('throws an error', async () => {
                jest.clearAllMocks()
                await expect(
                  mutate({
                    mutation: confirmContribution,
                    variables: {
                      id: creation ? creation.id : -1,
                    },
                  }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('Contribution already confirmed')],
                  }),
                )
              })
            })

            it('logs the error "Contribution already confirmed"', () => {
              expect(logger.error).toBeCalledWith(
                'Contribution already confirmed',
                expect.any(Number),
              )
            })
          })

          describe('confirm two creations one after the other quickly', () => {
            let c1: Contribution | null
            let c2: Contribution | null

            beforeAll(async () => {
              const now = new Date()
              c1 = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 50,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                contributionDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 2, 1),
                ),
              })
              c2 = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 50,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                contributionDate: contributionDateFormatter(
                  new Date(now.getFullYear(), now.getMonth() - 2, 1),
                ),
              })
              await query({
                query: login,
                variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
              })
            })

            it('throws no error for the second confirmation', async () => {
              const r1 = mutate({
                mutation: confirmContribution,
                variables: {
                  id: c1 ? c1.id : -1,
                },
              })
              const r2 = mutate({
                mutation: confirmContribution,
                variables: {
                  id: c2 ? c2.id : -1,
                },
              })
              await expect(r1).resolves.toEqual(
                expect.objectContaining({
                  data: { confirmContribution: true },
                }),
              )
              await expect(r2).resolves.toEqual(
                expect.objectContaining({
                  data: { confirmContribution: true },
                }),
              )
            })
          })
        })
      })
    })
  })

  describe('adminListContributions', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          query({
            query: adminListContributions,
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated as user', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(() => {
        resetToken()
      })

      it('returns an error', async () => {
        await expect(
          query({
            query: adminListContributions,
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated as admin', () => {
      beforeAll(async () => {
        await mutate({
          mutation: login,
          variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
        })
        await mutate({
          mutation: createContribution,
          variables: {
            amount: 100.0,
            memo: '#firefighters',
            contributionDate: new Date().toString(),
          },
        })
      })

      afterAll(() => {
        resetToken()
      })

      it('throw error for invalid ContributionStatus in statusFilter array', async () => {
        const { errors: errorObjects } = await query({
          query: adminListContributions,
          variables: {
            filter: {
              statusFilter: ['INVALID_STATUS'],
            },
          },
        })
        expect(errorObjects).toMatchObject([
          {
            message:
              'Variable "$filter" got invalid value "INVALID_STATUS" at "filter.statusFilter[0]"; Value "INVALID_STATUS" does not exist in "ContributionStatus" enum.',
            extensions: {
              code: 'BAD_USER_INPUT',
            },
          },
        ])
      })

      it('returns 18 creations in total', async () => {
        const {
          data: { adminListContributions: contributionListObject },
        } = await query({
          query: adminListContributions,
          variables: { paginated: { pageSize: 20 } },
        })

        expect(contributionListObject.contributionList).toHaveLength(18)
        expect(contributionListObject).toMatchObject({
          contributionCount: 18,
          contributionList: expect.arrayContaining([
            expect.objectContaining({
              amount: expect.decimalEqual(100),
              id: expect.any(Number),
              memo: '#firefighters',
              messagesCount: 0,
              contributionStatus: 'PENDING',
              user: expect.objectContaining({
                firstName: 'Peter',
                lastName: 'Lustig',
                emailContact: expect.objectContaining({
                  email: 'peter@lustig.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(50),
              id: expect.any(Number),
              memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
              messagesCount: 0,
              contributionStatus: 'CONFIRMED',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(50),
              id: expect.any(Number),
              memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
              messagesCount: 0,
              contributionStatus: 'CONFIRMED',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(450),
              id: expect.any(Number),
              memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
              messagesCount: 0,
              contributionStatus: 'CONFIRMED',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(400),
              id: expect.any(Number),
              memo: 'Herzlich Willkommen bei Gradido!',
              messagesCount: 0,
              contributionStatus: 'PENDING',
              user: expect.objectContaining({
                firstName: 'Peter',
                lastName: 'Lustig',
                emailContact: expect.objectContaining({
                  email: 'peter@lustig.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(100),
              id: expect.any(Number),
              memo: 'Confirmed Contribution',
              messagesCount: 0,
              contributionStatus: 'CONFIRMED',
              user: expect.objectContaining({
                firstName: 'Bob',
                lastName: 'der Baumeister',
                emailContact: expect.objectContaining({
                  email: 'bob@baumeister.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(100),
              id: expect.any(Number),
              memo: 'Test env contribution',
              messagesCount: 0,
              contributionStatus: 'PENDING',
              user: expect.objectContaining({
                firstName: 'Peter',
                lastName: 'Lustig',
                emailContact: expect.objectContaining({
                  email: 'peter@lustig.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(200),
              id: expect.any(Number),
              memo: 'Aktives Grundeinkommen',
              messagesCount: 0,
              contributionStatus: 'PENDING',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(200),
              id: expect.any(Number),
              memo: 'Das war leider zu Viel!',
              messagesCount: 1,
              contributionStatus: 'DELETED',
              user: expect.objectContaining({
                firstName: 'Peter',
                lastName: 'Lustig',
                emailContact: expect.objectContaining({
                  email: 'peter@lustig.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(166),
              id: expect.any(Number),
              memo: 'Whatever contribution',
              messagesCount: 0,
              contributionStatus: 'DENIED',
              user: expect.objectContaining({
                firstName: 'Räuber',
                lastName: 'Hotzenplotz',
                emailContact: expect.objectContaining({
                  email: 'raeuber@hotzenplotz.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(166),
              id: expect.any(Number),
              memo: 'Whatever contribution',
              messagesCount: 0,
              contributionStatus: 'DELETED',
              user: expect.objectContaining({
                firstName: 'Räuber',
                lastName: 'Hotzenplotz',
                emailContact: expect.objectContaining({
                  email: 'raeuber@hotzenplotz.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(166),
              id: expect.any(Number),
              memo: 'Whatever contribution',
              messagesCount: 0,
              contributionStatus: 'CONFIRMED',
              user: expect.objectContaining({
                firstName: 'Räuber',
                lastName: 'Hotzenplotz',
                emailContact: expect.objectContaining({
                  email: 'raeuber@hotzenplotz.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(100),
              id: expect.any(Number),
              memo: 'Test contribution to delete',
              messagesCount: 0,
              contributionStatus: 'DELETED',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(100),
              id: expect.any(Number),
              memo: 'Test contribution to deny',
              messagesCount: 0,
              contributionStatus: 'DENIED',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(100),
              id: expect.any(Number),
              memo: 'Test contribution to confirm',
              messagesCount: 0,
              contributionStatus: 'CONFIRMED',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(100),
              id: expect.any(Number),
              memo: 'Test IN_PROGRESS contribution',
              messagesCount: 1,
              contributionStatus: 'IN_PROGRESS',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(10),
              id: expect.any(Number),
              memo: 'Test PENDING contribution update',
              messagesCount: 2,
              contributionStatus: 'PENDING',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: expect.decimalEqual(1000),
              id: expect.any(Number),
              memo: 'Herzlich Willkommen bei Gradido!',
              messagesCount: 0,
              contributionStatus: 'CONFIRMED',
              user: expect.objectContaining({
                firstName: 'Bibi',
                lastName: 'Bloxberg',
                emailContact: expect.objectContaining({
                  email: 'bibi@bloxberg.de',
                }),
              }),
            }),
          ]),
        })
      })

      it('returns two pending creations with page size set to 2', async () => {
        const {
          data: { adminListContributions: contributionListObject },
        } = await query({
          query: adminListContributions,
          variables: {
            paginated: {
              currentPage: 1,
              pageSize: 2,
              order: Order.DESC,
            },
            filter: {
              statusFilter: ['PENDING'],
            },
          },
        })
        expect(contributionListObject.contributionList).toHaveLength(2)
        expect(contributionListObject).toMatchObject({
          contributionCount: 5,
          contributionList: expect.arrayContaining([
            expect.objectContaining({
              amount: '100',
              id: expect.any(Number),
              memo: '#firefighters',
              messagesCount: 0,
              contributionStatus: 'PENDING',
              user: expect.objectContaining({
                firstName: 'Peter',
                lastName: 'Lustig',
                emailContact: expect.objectContaining({
                  email: 'peter@lustig.de',
                }),
              }),
            }),
            expect.objectContaining({
              amount: '400',
              id: expect.any(Number),
              memo: 'Herzlich Willkommen bei Gradido!',
              messagesCount: 0,
              contributionStatus: 'PENDING',
              user: expect.objectContaining({
                firstName: 'Peter',
                lastName: 'Lustig',
                emailContact: expect.objectContaining({
                  email: 'peter@lustig.de',
                }),
              }),
            }),
            expect.not.objectContaining({
              contributionStatus: 'DENIED',
            }),
            expect.not.objectContaining({
              contributionStatus: 'DELETED',
            }),
            expect.not.objectContaining({
              contributionStatus: 'CONFIRMED',
            }),
            expect.not.objectContaining({
              contributionStatus: 'IN_PROGRESS',
            }),
          ]),
        })
      })

      describe('with user query', () => {
        it('returns only contributions of the queried user', async () => {
          const {
            data: { adminListContributions: contributionListObject },
          } = await query({
            query: adminListContributions,
            variables: {
              filter: {
                query: 'Peter',
              },
              paginated: { pageSize: 20 },
            },
          })
          expect(contributionListObject.contributionList).toHaveLength(4)
          expect(contributionListObject).toMatchObject({
            contributionCount: 4,
            contributionList: expect.arrayContaining([
              expect.objectContaining({
                amount: expect.decimalEqual(100),
                id: expect.any(Number),
                memo: '#firefighters',
                messagesCount: 0,
                contributionStatus: 'PENDING',
                user: expect.objectContaining({
                  firstName: 'Peter',
                  lastName: 'Lustig',
                  emailContact: expect.objectContaining({
                    email: 'peter@lustig.de',
                  }),
                }),
              }),
              expect.objectContaining({
                amount: expect.decimalEqual(400),
                id: expect.any(Number),
                memo: 'Herzlich Willkommen bei Gradido!',
                messagesCount: 0,
                contributionStatus: 'PENDING',
                user: expect.objectContaining({
                  firstName: 'Peter',
                  lastName: 'Lustig',
                  emailContact: expect.objectContaining({
                    email: 'peter@lustig.de',
                  }),
                }),
              }),
              expect.objectContaining({
                amount: expect.decimalEqual(100),
                id: expect.any(Number),
                memo: 'Test env contribution',
                messagesCount: 0,
                contributionStatus: 'PENDING',
                user: expect.objectContaining({
                  firstName: 'Peter',
                  lastName: 'Lustig',
                  emailContact: expect.objectContaining({
                    email: 'peter@lustig.de',
                  }),
                }),
              }),
              expect.objectContaining({
                amount: expect.decimalEqual(200),
                id: expect.any(Number),
                memo: 'Das war leider zu Viel!',
                messagesCount: 1,
                contributionStatus: 'DELETED',
                user: expect.objectContaining({
                  firstName: 'Peter',
                  lastName: 'Lustig',
                  emailContact: expect.objectContaining({
                    email: 'peter@lustig.de',
                  }),
                }),
              }),
            ]),
          })
        })

        it('returns only contributions of the queried user without hashtags', async () => {
          const {
            data: { adminListContributions: contributionListObject },
          } = await query({
            query: adminListContributions,
            variables: {
              filter: {
                query: 'Peter',
                noHashtag: true,
              },
              paginated: { pageSize: 20 },
            },
          })
          expect(contributionListObject.contributionList).toHaveLength(3)
          expect(contributionListObject).toMatchObject({
            contributionCount: 3,
            contributionList: expect.arrayContaining([
              expect.objectContaining({
                amount: expect.decimalEqual(400),
                id: expect.any(Number),
                memo: 'Herzlich Willkommen bei Gradido!',
                messagesCount: 0,
                contributionStatus: 'PENDING',
                user: expect.objectContaining({
                  firstName: 'Peter',
                  lastName: 'Lustig',
                  emailContact: expect.objectContaining({
                    email: 'peter@lustig.de',
                  }),
                }),
              }),
              expect.objectContaining({
                amount: expect.decimalEqual(100),
                id: expect.any(Number),
                memo: 'Test env contribution',
                messagesCount: 0,
                contributionStatus: 'PENDING',
                user: expect.objectContaining({
                  firstName: 'Peter',
                  lastName: 'Lustig',
                  emailContact: expect.objectContaining({
                    email: 'peter@lustig.de',
                  }),
                }),
              }),
              expect.objectContaining({
                amount: expect.decimalEqual(200),
                id: expect.any(Number),
                memo: 'Das war leider zu Viel!',
                messagesCount: 1,
                contributionStatus: 'DELETED',
                user: expect.objectContaining({
                  firstName: 'Peter',
                  lastName: 'Lustig',
                  emailContact: expect.objectContaining({
                    email: 'peter@lustig.de',
                  }),
                }),
              }),
            ]),
          })
        })

        it('returns only contributions with #firefighter', async () => {
          const {
            data: { adminListContributions: contributionListObject },
          } = await query({
            query: adminListContributions,
            variables: {
              filter: {
                query: '#firefighter',
              },
            },
          })
          expect(contributionListObject.contributionList).toHaveLength(1)
          expect(contributionListObject).toMatchObject({
            contributionCount: 1,
            contributionList: expect.arrayContaining([
              expect.objectContaining({
                amount: expect.decimalEqual(100),
                id: expect.any(Number),
                memo: '#firefighters',
                messagesCount: 0,
                contributionStatus: 'PENDING',
                user: expect.objectContaining({
                  firstName: 'Peter',
                  lastName: 'Lustig',
                  emailContact: expect.objectContaining({
                    email: 'peter@lustig.de',
                  }),
                }),
              }),
            ]),
          })
        })

        it('returns no contributions with #firefighter and no hashtag', async () => {
          const {
            data: { adminListContributions: contributionListObject },
          } = await query({
            query: adminListContributions,
            variables: {
              filter: {
                query: '#firefighter',
                noHashtag: true,
              },
            },
          })
          expect(contributionListObject.contributionList).toHaveLength(0)
          expect(contributionListObject).toMatchObject({
            contributionCount: 0,
          })
        })

        // test for case sensitivity and email
        it('returns only contributions of the queried user email', async () => {
          const {
            data: { adminListContributions: contributionListObject },
          } = await query({
            query: adminListContributions,
            variables: {
              filter: {
                query: 'RAEUBER', // only found in lowercase in the email
              },
              paginated: { pageSize: 20 },
            },
          })
          expect(contributionListObject.contributionList).toHaveLength(3)
          expect(contributionListObject).toMatchObject({
            contributionCount: 3,
            contributionList: expect.arrayContaining([
              expect.objectContaining({
                amount: expect.decimalEqual(166),
                id: expect.any(Number),
                memo: 'Whatever contribution',
                messagesCount: 0,
                contributionStatus: 'DENIED',
                user: expect.objectContaining({
                  firstName: 'Räuber',
                  lastName: 'Hotzenplotz',
                  emailContact: expect.objectContaining({
                    email: 'raeuber@hotzenplotz.de',
                  }),
                }),
              }),
              expect.objectContaining({
                amount: expect.decimalEqual(166),
                id: expect.any(Number),
                memo: 'Whatever contribution',
                messagesCount: 0,
                contributionStatus: 'DELETED',
                user: expect.objectContaining({
                  firstName: 'Räuber',
                  lastName: 'Hotzenplotz',
                  emailContact: expect.objectContaining({
                    email: 'raeuber@hotzenplotz.de',
                  }),
                }),
              }),
              expect.objectContaining({
                amount: expect.decimalEqual(166),
                id: expect.any(Number),
                memo: 'Whatever contribution',
                messagesCount: 0,
                contributionStatus: 'CONFIRMED',
                user: expect.objectContaining({
                  firstName: 'Räuber',
                  lastName: 'Hotzenplotz',
                  emailContact: expect.objectContaining({
                    email: 'raeuber@hotzenplotz.de',
                  }),
                }),
              }),
            ]),
          })
        })
      })
    })
  })
})
