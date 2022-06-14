/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { objectValuesToArray } from '@/util/utilities'
import { testEnvironment, resetToken, cleanDB } from '@test/helpers'
import { userFactory } from '@/seeds/factory/user'
import { creationFactory } from '@/seeds/factory/creation'
import { creations } from '@/seeds/creation/index'
import { transactionLinkFactory } from '@/seeds/factory/transactionLink'
import { transactionLinks } from '@/seeds/transactionLink/index'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import {
  deleteUser,
  unDeleteUser,
  createPendingCreation,
  createPendingCreations,
  updatePendingCreation,
  deletePendingCreation,
  confirmPendingCreation,
} from '@/seeds/graphql/mutations'
import {
  getPendingCreations,
  login,
  searchUsers,
  listTransactionLinksAdmin,
} from '@/seeds/graphql/queries'
import { GraphQLError } from 'graphql'
import { User } from '@entity/User'
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { sendAccountActivationEmail } from '@/mailer/sendAccountActivationEmail'
import Decimal from 'decimal.js-light'
import { Contribution } from '@entity/Contribution'
import { Transaction as DbTransaction } from '@entity/Transaction'

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
let creation: Contribution | void

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
      describe('without admin rights', () => {
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

        describe('user to be deleted does not exist', () => {
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
      describe('without admin rights', () => {
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

        describe('user to be undelete does not exist', () => {
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
                errors: [new GraphQLError('User is not deleted')],
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

  describe('search users', () => {
    const variablesWithoutTextAndFilters = {
      searchText: '',
      currentPage: 1,
      pageSize: 25,
      filters: null,
    }

    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          query({
            query: searchUsers,
            variables: {
              ...variablesWithoutTextAndFilters,
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
      describe('without admin rights', () => {
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
            query({
              query: searchUsers,
              variables: {
                ...variablesWithoutTextAndFilters,
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('with admin rights', () => {
        const allUsers = {
          bibi: expect.objectContaining({
            email: 'bibi@bloxberg.de',
          }),
          garrick: expect.objectContaining({
            email: 'garrick@ollivander.com',
          }),
          peter: expect.objectContaining({
            email: 'peter@lustig.de',
          }),
          stephen: expect.objectContaining({
            email: 'stephen@hawking.uk',
          }),
        }

        beforeAll(async () => {
          admin = await userFactory(testEnv, peterLustig)
          await query({
            query: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })

          await userFactory(testEnv, bibiBloxberg)
          await userFactory(testEnv, stephenHawking)
          await userFactory(testEnv, garrickOllivander)
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('without any filters', () => {
          it('finds all users', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 4,
                    userList: expect.arrayContaining(objectValuesToArray(allUsers)),
                  },
                },
              }),
            )
          })
        })

        describe('all filters are null', () => {
          it('finds all users', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  filters: {
                    byActivated: null,
                    byDeleted: null,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 4,
                    userList: expect.arrayContaining(objectValuesToArray(allUsers)),
                  },
                },
              }),
            )
          })
        })

        describe('filter by unchecked email', () => {
          it('finds only users with unchecked email', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  filters: {
                    byActivated: false,
                    byDeleted: null,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 1,
                    userList: expect.arrayContaining([allUsers.garrick]),
                  },
                },
              }),
            )
          })
        })

        describe('filter by deleted users', () => {
          it('finds only users with deleted account', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  filters: {
                    byActivated: null,
                    byDeleted: true,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 1,
                    userList: expect.arrayContaining([allUsers.stephen]),
                  },
                },
              }),
            )
          })
        })

        describe('filter by deleted account and unchecked email', () => {
          it('finds no users', async () => {
            await expect(
              query({
                query: searchUsers,
                variables: {
                  ...variablesWithoutTextAndFilters,
                  filters: {
                    byActivated: false,
                    byDeleted: true,
                  },
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  searchUsers: {
                    userCount: 0,
                    userList: [],
                  },
                },
              }),
            )
          })
        })
      })
    })
  })

  describe('creations', () => {
    const variables = {
      email: 'bibi@bloxberg.de',
      amount: new Decimal(2000),
      memo: 'Aktives Grundeinkommen',
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

      describe('updatePendingCreation', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: updatePendingCreation,
              variables: {
                id: 1,
                email: 'bibi@bloxberg.de',
                amount: new Decimal(300),
                memo: 'Danke Bibi!',
                creationDate: new Date().toString(),
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('getPendingCreations', () => {
        it('returns an error', async () => {
          await expect(
            query({
              query: getPendingCreations,
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('deletePendingCreation', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: deletePendingCreation,
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

      describe('confirmPendingCreation', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: confirmPendingCreation,
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

        describe('updatePendingCreation', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: updatePendingCreation,
                variables: {
                  id: 1,
                  email: 'bibi@bloxberg.de',
                  amount: new Decimal(300),
                  memo: 'Danke Bibi!',
                  creationDate: new Date().toString(),
                },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('getPendingCreations', () => {
          it('returns an error', async () => {
            await expect(
              query({
                query: getPendingCreations,
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('deletePendingCreation', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: deletePendingCreation,
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

        describe('confirmPendingCreation', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: confirmPendingCreation,
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
          beforeAll(async () => {
            const now = new Date()
            creation = await creationFactory(testEnv, {
              email: 'peter@lustig.de',
              amount: 400,
              memo: 'Herzlich Willkommen bei Gradido!',
              creationDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
            })
          })

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
                    errors: [
                      new GraphQLError('No information for available creations for the given date'),
                    ],
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
                    errors: [
                      new GraphQLError('No information for available creations for the given date'),
                    ],
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
                    errors: [
                      new GraphQLError('No information for available creations for the given date'),
                    ],
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
                        'The amount (2000 GDD) to be created exceeds the amount (1000 GDD) still available for this month.',
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
                        'The amount (1000 GDD) to be created exceeds the amount (800 GDD) still available for this month.',
                      ),
                    ],
                  }),
                )
              })
            })
          })
        })

        describe('createPendingCreations', () => {
          // at this point we have this data in DB:
          // bibi@bloxberg.de: [1000, 1000, 800]
          // peter@lustig.de: [1000, 600, 1000]
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
              amount: new Decimal(500),
              memo: 'Grundeinkommen',
              creationDate: new Date().toString(),
            }
          })

          it('returns success, two successful creation and three failed creations', async () => {
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
                    successfulCreation: ['bibi@bloxberg.de', 'peter@lustig.de'],
                    failedCreation: [
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

        describe('updatePendingCreation', () => {
          // at this I expect to have this data in DB:
          // bibi@bloxberg.de: [1000, 1000, 300]
          // peter@lustig.de: [1000, 600, 500]
          // stephen@hawking.uk: [1000, 1000, 1000] - deleted
          // garrick@ollivander.com: [1000, 1000, 1000] - not activated

          describe('user for creation to update does not exist', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: updatePendingCreation,
                  variables: {
                    id: 1,
                    email: 'bob@baumeister.de',
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: new Date().toString(),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Could not find user with email: bob@baumeister.de')],
                }),
              )
            })
          })

          describe('user for creation to update is deleted', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: updatePendingCreation,
                  variables: {
                    id: 1,
                    email: 'stephen@hawking.uk',
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: new Date().toString(),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('User was deleted (stephen@hawking.uk)')],
                }),
              )
            })
          })

          describe('creation does not exist', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: updatePendingCreation,
                  variables: {
                    id: -1,
                    email: 'bibi@bloxberg.de',
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: new Date().toString(),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('No contribution found to given id.')],
                }),
              )
            })
          })

          describe('user email does not match creation user', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: updatePendingCreation,
                  variables: {
                    id: creation ? creation.id : -1,
                    email: 'bibi@bloxberg.de',
                    amount: new Decimal(300),
                    memo: 'Danke Bibi!',
                    creationDate: new Date().toString(),
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
          })

          describe('creation update is not valid', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: updatePendingCreation,
                  variables: {
                    id: creation ? creation.id : -1,
                    email: 'peter@lustig.de',
                    amount: new Decimal(1900),
                    memo: 'Danke Peter!',
                    creationDate: new Date().toString(),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError(
                      'The amount (1900 GDD) to be created exceeds the amount (500 GDD) still available for this month.',
                    ),
                  ],
                }),
              )
            })
          })

          describe('creation update is successful changing month', () => {
            it('returns update creation object', async () => {
              await expect(
                mutate({
                  mutation: updatePendingCreation,
                  variables: {
                    id: creation ? creation.id : -1,
                    email: 'peter@lustig.de',
                    amount: new Decimal(300),
                    memo: 'Danke Peter!',
                    creationDate: new Date().toString(),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: {
                    updatePendingCreation: {
                      date: expect.any(String),
                      memo: 'Danke Peter!',
                      amount: '300',
                      creation: ['1000', '1000', '200'],
                    },
                  },
                }),
              )
            })
          })

          describe('creation update is successful without changing month', () => {
            it('returns update creation object', async () => {
              await expect(
                mutate({
                  mutation: updatePendingCreation,
                  variables: {
                    id: creation ? creation.id : -1,
                    email: 'peter@lustig.de',
                    amount: new Decimal(200),
                    memo: 'Das war leider zu Viel!',
                    creationDate: new Date().toString(),
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: {
                    updatePendingCreation: {
                      date: expect.any(String),
                      memo: 'Das war leider zu Viel!',
                      amount: '200',
                      creation: ['1000', '1000', '300'],
                    },
                  },
                }),
              )
            })
          })
        })

        describe('getPendingCreations', () => {
          it('returns four pending creations', async () => {
            await expect(
              query({
                query: getPendingCreations,
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  getPendingCreations: expect.arrayContaining([
                    {
                      id: expect.any(Number),
                      firstName: 'Peter',
                      lastName: 'Lustig',
                      email: 'peter@lustig.de',
                      date: expect.any(String),
                      memo: 'Das war leider zu Viel!',
                      amount: '200',
                      moderator: admin.id,
                      creation: ['1000', '1000', '300'],
                    },
                    {
                      id: expect.any(Number),
                      firstName: 'Peter',
                      lastName: 'Lustig',
                      email: 'peter@lustig.de',
                      date: expect.any(String),
                      memo: 'Grundeinkommen',
                      amount: '500',
                      moderator: admin.id,
                      creation: ['1000', '1000', '300'],
                    },
                    {
                      id: expect.any(Number),
                      firstName: 'Bibi',
                      lastName: 'Bloxberg',
                      email: 'bibi@bloxberg.de',
                      date: expect.any(String),
                      memo: 'Grundeinkommen',
                      amount: '500',
                      moderator: admin.id,
                      creation: ['1000', '1000', '300'],
                    },
                    {
                      id: expect.any(Number),
                      firstName: 'Bibi',
                      lastName: 'Bloxberg',
                      email: 'bibi@bloxberg.de',
                      date: expect.any(String),
                      memo: 'Aktives Grundeinkommen',
                      amount: '200',
                      moderator: admin.id,
                      creation: ['1000', '1000', '300'],
                    },
                  ]),
                },
              }),
            )
          })
        })

        describe('deletePendingCreation', () => {
          describe('creation id does not exist', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: deletePendingCreation,
                  variables: {
                    id: -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Creation not found for given id.')],
                }),
              )
            })
          })

          describe('creation id does exist', () => {
            it('returns true', async () => {
              await expect(
                mutate({
                  mutation: deletePendingCreation,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { deletePendingCreation: true },
                }),
              )
            })
          })
        })

        describe('confirmPendingCreation', () => {
          describe('creation does not exits', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: confirmPendingCreation,
                  variables: {
                    id: -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Creation not found to given id.')],
                }),
              )
            })
          })

          describe('confirm own creation', () => {
            beforeAll(async () => {
              const now = new Date()
              creation = await creationFactory(testEnv, {
                email: 'peter@lustig.de',
                amount: 400,
                memo: 'Herzlich Willkommen bei Gradido!',
                creationDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
              })
            })

            it('thows an error', async () => {
              await expect(
                mutate({
                  mutation: confirmPendingCreation,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Moderator can not confirm own pending creation')],
                }),
              )
            })
          })

          describe('confirm creation for other user', () => {
            beforeAll(async () => {
              const now = new Date()
              creation = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 450,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                creationDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
              })
            })

            it('returns true', async () => {
              await expect(
                mutate({
                  mutation: confirmPendingCreation,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { confirmPendingCreation: true },
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
              expect(transaction[0].linkedUserId).toEqual(null)
              expect(transaction[0].typeId).toEqual(1)
            })
          })

          describe('confirm two creations one after the other quickly', () => {
            let c1: Contribution | void
            let c2: Contribution | void

            beforeAll(async () => {
              const now = new Date()
              c1 = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 50,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                creationDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
              })
              c2 = await creationFactory(testEnv, {
                email: 'bibi@bloxberg.de',
                amount: 50,
                memo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                creationDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
              })
            })

            // In the futrue this should not throw anymore
            it('throws an error for the second confirmation', async () => {
              const r1 = mutate({
                mutation: confirmPendingCreation,
                variables: {
                  id: c1 ? c1.id : -1,
                },
              })
              const r2 = mutate({
                mutation: confirmPendingCreation,
                variables: {
                  id: c2 ? c2.id : -1,
                },
              })
              await expect(r1).resolves.toEqual(
                expect.objectContaining({
                  data: { confirmPendingCreation: true },
                }),
              )
              await expect(r2).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Creation was not successful.')],
                }),
              )
            })
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
          await query({
            query: login,
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
})
