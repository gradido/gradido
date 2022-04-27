/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { testEnvironment, resetToken, cleanDB } from '@test/helpers'
import { userFactory } from '@/seeds/factory/user'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import {
  deleteUser,
  unDeleteUser,
  createPendingCreation,
  createPendingCreations,
} from '@/seeds/graphql/mutations'
import { GraphQLError } from 'graphql'
import { User } from '@entity/User'
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { sendAccountActivationEmail } from '@/mailer/sendAccountActivationEmail'
import { login } from '@/seeds/graphql/queries'
import Decimal from 'decimal.js-light'

// mock account activation email to avoid console spam
jest.mock('@/mailer/sendAccountActivationEmail', () => {
  return {
    __esModule: true,
    sendAccountActivationEmail: jest.fn(),
  }
})

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
  await cleanDB()
  await con.close()
})

let admin: User
let user: User

describe('AdminResolver', () => {
  describe('delete user', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(mutate({ mutation: deleteUser, variables: { userId: 1 } })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('with user rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            mutate({ mutation: deleteUser, variables: { userId: user.id + 1 } }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        beforeAll(async () => {
          admin = await userFactory(testEnv, peterLustig)
          await query({
            query: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('user to delete user does not exist', () => {
          it('throws an error', async () => {
            await expect(
              mutate({ mutation: deleteUser, variables: { userId: admin.id + 1 } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError(`Could not find user with userId: ${admin.id + 1}`)],
              }),
            )
          })
        })

        describe('delete self', () => {
          it('throws an error', async () => {
            await expect(
              mutate({ mutation: deleteUser, variables: { userId: admin.id } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('Moderator can not delete his own account!')],
              }),
            )
          })
        })

        describe('delete with success', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
          })

          it('returns date string', async () => {
            const result = await mutate({ mutation: deleteUser, variables: { userId: user.id } })
            expect(result).toEqual(
              expect.objectContaining({
                data: {
                  deleteUser: expect.any(String),
                },
              }),
            )
            expect(new Date(result.data.deleteUser)).toEqual(expect.any(Date))
          })

          describe('delete deleted user', () => {
            it('throws an error', async () => {
              await expect(
                mutate({ mutation: deleteUser, variables: { userId: user.id } }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError(`Could not find user with userId: ${user.id}`)],
                }),
              )
            })
          })
        })
      })
    })
  })

  describe('unDelete user', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(mutate({ mutation: unDeleteUser, variables: { userId: 1 } })).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated', () => {
      describe('with user rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('returns an error', async () => {
          await expect(
            mutate({ mutation: unDeleteUser, variables: { userId: user.id + 1 } }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        beforeAll(async () => {
          admin = await userFactory(testEnv, peterLustig)
          await query({
            query: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('user to undelete user does not exist', () => {
          it('throws an error', async () => {
            await expect(
              mutate({ mutation: unDeleteUser, variables: { userId: admin.id + 1 } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError(`Could not find user with userId: ${admin.id + 1}`)],
              }),
            )
          })
        })

        describe('user to undelete is not deleted', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
          })

          it('throws an error', async () => {
            await expect(
              mutate({ mutation: unDeleteUser, variables: { userId: user.id } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('User already deleted')],
              }),
            )
          })

          describe('undelete deleted user', () => {
            beforeAll(async () => {
              await mutate({ mutation: deleteUser, variables: { userId: user.id } })
            })

            it('returns null', async () => {
              await expect(
                mutate({ mutation: unDeleteUser, variables: { userId: user.id } }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { unDeleteUser: null },
                }),
              )
            })
          })
        })
      })
    })
  })

  describe('creations', () => {
    const variables = {
      email: 'bibi@bloxberg.de',
      amount: new Decimal(2000),
      memo: 'Vielen Dank für den Zaubertrank!',
      creationDate: 'not-valid',
    }

    describe('unauthenticated', () => {
      describe('createPendingCreation', () => {
        it('returns an error', async () => {
          await expect(mutate({ mutation: createPendingCreation, variables })).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('createPendingCreations', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: createPendingCreations,
              variables: { pendingCreations: [variables] },
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
      describe('with user rights', () => {
        beforeAll(async () => {
          user = await userFactory(testEnv, bibiBloxberg)
          await query({
            query: login,
            variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('createPendingCreation', () => {
          it('returns an error', async () => {
            await expect(mutate({ mutation: createPendingCreation, variables })).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('createPendingCreations', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: createPendingCreations,
                variables: { pendingCreations: [variables] },
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
          admin = await userFactory(testEnv, peterLustig)
          await query({
            query: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('createPendingCreation', () => {
          describe('user to create for does not exist', () => {
            it('throws an error', async () => {
              await expect(mutate({ mutation: createPendingCreation, variables })).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Could not find user with email: bibi@bloxberg.de')],
                }),
              )
            })
          })

          describe('user to create for is deleted', () => {
            beforeAll(async () => {
              user = await userFactory(testEnv, stephenHawking)
              variables.email = 'stephen@hawking.uk'
            })

            it('throws an error', async () => {
              await expect(mutate({ mutation: createPendingCreation, variables })).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('This user was deleted. Cannot make a creation.')],
                }),
              )
            })
          })

          describe('user to create for has email not confirmed', () => {
            beforeAll(async () => {
              user = await userFactory(testEnv, garrickOllivander)
              variables.email = 'garrick@ollivander.com'
            })

            it('throws an error', async () => {
              await expect(mutate({ mutation: createPendingCreation, variables })).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Creation could not be saved, Email is not activated')],
                }),
              )
            })
          })

          describe('valid user to create for', () => {
            beforeAll(async () => {
              user = await userFactory(testEnv, bibiBloxberg)
              variables.email = 'bibi@bloxberg.de'
            })

            describe('date of creation is not a date string', () => {
              it('throws an error', async () => {
                await expect(
                  mutate({ mutation: createPendingCreation, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('No Creation found!')],
                  }),
                )
              })
            })

            describe('date of creation is four months ago', () => {
              it('throws an error', async () => {
                const now = new Date()
                variables.creationDate = new Date(
                  now.getFullYear(),
                  now.getMonth() - 4,
                  1,
                ).toString()
                await expect(
                  mutate({ mutation: createPendingCreation, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('No Creation found!')],
                  }),
                )
              })
            })

            describe('date of creation is in the future', () => {
              it('throws an error', async () => {
                const now = new Date()
                variables.creationDate = new Date(
                  now.getFullYear(),
                  now.getMonth() + 4,
                  1,
                ).toString()
                await expect(
                  mutate({ mutation: createPendingCreation, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('No Creation found!')],
                  }),
                )
              })
            })

            describe('amount of creation is too high', () => {
              it('throws an error', async () => {
                variables.creationDate = new Date().toString()
                await expect(
                  mutate({ mutation: createPendingCreation, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError(
                        'The amount (2000 GDD) to be created exceeds the available amount (1000 GDD) for this month.',
                      ),
                    ],
                  }),
                )
              })
            })

            describe('creation is valid', () => {
              it('returns an array of the open creations for the last three months', async () => {
                variables.amount = new Decimal(200)
                await expect(
                  mutate({ mutation: createPendingCreation, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    data: {
                      createPendingCreation: [1000, 1000, 800],
                    },
                  }),
                )
              })
            })

            describe('second creation surpasses the available amount ', () => {
              it('returns an array of the open creations for the last three months', async () => {
                variables.amount = new Decimal(1000)
                await expect(
                  mutate({ mutation: createPendingCreation, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [
                      new GraphQLError(
                        'The amount (1000 GDD) to be created exceeds the available amount (800 GDD) for this month.',
                      ),
                    ],
                  }),
                )
              })
            })
          })

          describe('createPendingCreations', () => {
            // at this point we have this data in DB:
            // bibi@bloxberg.de: [1000, 1000, 800]
            // peter@lustig.de: [1000, 1000, 1000]
            // stephen@hawking.uk: [1000, 1000, 1000] - deleted
            // garrick@ollivander.com: [1000, 1000, 1000] - not activated

            const massCreationVariables = [
              'bibi@bloxberg.de',
              'peter@lustig.de',
              'stephen@hawking.uk',
              'garrick@ollivander.com',
              'bob@baumeister.de',
            ].map((email) => {
              return {
                email,
                amount: new Decimal(1000),
                memo: 'Grundeinkommen',
                creationDate: new Date().toString(),
              }
            })

            it('returns success, one successful creation and four failed creations', async () => {
              await expect(
                mutate({
                  mutation: createPendingCreations,
                  variables: { pendingCreations: massCreationVariables },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: {
                    createPendingCreations: {
                      success: true,
                      successfulCreation: ['peter@lustig.de'],
                      failedCreation: [
                        'bibi@bloxberg.de',
                        'stephen@hawking.uk',
                        'garrick@ollivander.com',
                        'bob@baumeister.de',
                      ],
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
