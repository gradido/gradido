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
  login,
  setUserRole,
  deleteUser,
  unDeleteUser,
  adminCreateContribution,
  adminCreateContributions,
  adminUpdateContribution,
  adminDeleteContribution,
  confirmContribution,
  createContributionLink,
  deleteContributionLink,
  updateContributionLink,
} from '@/seeds/graphql/mutations'
import {
  listUnconfirmedContributions,
  searchUsers,
  listTransactionLinksAdmin,
  listContributionLinks,
} from '@/seeds/graphql/queries'
import { GraphQLError } from 'graphql'
import { User } from '@entity/User'
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { sendAccountActivationEmail } from '@/mailer/sendAccountActivationEmail'
import Decimal from 'decimal.js-light'
import { Contribution } from '@entity/Contribution'
import { Transaction as DbTransaction } from '@entity/Transaction'
import { ContributionLink as DbContributionLink } from '@entity/ContributionLink'
import { sendContributionConfirmedEmail } from '@/mailer/sendContributionConfirmedEmail'

// mock account activation email to avoid console spam
jest.mock('@/mailer/sendAccountActivationEmail', () => {
  return {
    __esModule: true,
    sendAccountActivationEmail: jest.fn(),
  }
})

// mock account activation email to avoid console spam
jest.mock('@/mailer/sendContributionConfirmedEmail', () => {
  return {
    __esModule: true,
    sendContributionConfirmedEmail: jest.fn(),
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
  describe('set user role', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({ mutation: setUserRole, variables: { userId: 1, isAdmin: true } }),
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
            mutate({ mutation: setUserRole, variables: { userId: user.id + 1, isAdmin: true } }),
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
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('user to get a new role does not exist', () => {
          it('throws an error', async () => {
            await expect(
              mutate({ mutation: setUserRole, variables: { userId: admin.id + 1, isAdmin: true } }),
            ).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError(`Could not find user with userId: ${admin.id + 1}`)],
              }),
            )
          })
        })

        describe('change role with success', () => {
          beforeAll(async () => {
            user = await userFactory(testEnv, bibiBloxberg)
          })

          describe('user gets new role', () => {
            describe('to admin', () => {
              it('returns date string', async () => {
                const result = await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, isAdmin: true },
                })
                expect(result).toEqual(
                  expect.objectContaining({
                    data: {
                      setUserRole: expect.any(String),
                    },
                  }),
                )
                expect(new Date(result.data.setUserRole)).toEqual(expect.any(Date))
              })
            })

            describe('to usual user', () => {
              it('returns null', async () => {
                await expect(
                  mutate({ mutation: setUserRole, variables: { userId: user.id, isAdmin: false } }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    data: {
                      setUserRole: null,
                    },
                  }),
                )
              })
            })
          })
        })

        describe('change role with error', () => {
          describe('is own role', () => {
            it('throws an error', async () => {
              await expect(
                mutate({ mutation: setUserRole, variables: { userId: admin.id, isAdmin: false } }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Administrator can not change his own role!')],
                }),
              )
            })
          })

          describe('user has already role to be set', () => {
            describe('to admin', () => {
              it('throws an error', async () => {
                await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, isAdmin: true },
                })
                await expect(
                  mutate({ mutation: setUserRole, variables: { userId: user.id, isAdmin: true } }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('User is already admin!')],
                  }),
                )
              })
            })

            describe('to usual user', () => {
              it('throws an error', async () => {
                await mutate({
                  mutation: setUserRole,
                  variables: { userId: user.id, isAdmin: false },
                })
                await expect(
                  mutate({ mutation: setUserRole, variables: { userId: user.id, isAdmin: false } }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    errors: [new GraphQLError('User is already a usual user!')],
                  }),
                )
              })
            })
          })
        })
      })
    })
  })

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
          await mutate({
            mutation: login,
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
          await mutate({
            mutation: login,
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
          await mutate({
            mutation: login,
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
      describe('adminCreateContribution', () => {
        it('returns an error', async () => {
          await expect(mutate({ mutation: adminCreateContribution, variables })).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('401 Unauthorized')],
            }),
          )
        })
      })

      describe('adminCreateContributions', () => {
        it('returns an error', async () => {
          await expect(
            mutate({
              mutation: adminCreateContributions,
              variables: { pendingCreations: [variables] },
            }),
          ).resolves.toEqual(
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

      describe('listUnconfirmedContributions', () => {
        it('returns an error', async () => {
          await expect(
            query({
              query: listUnconfirmedContributions,
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

        describe('adminCreateContribution', () => {
          it('returns an error', async () => {
            await expect(mutate({ mutation: adminCreateContribution, variables })).resolves.toEqual(
              expect.objectContaining({
                errors: [new GraphQLError('401 Unauthorized')],
              }),
            )
          })
        })

        describe('adminCreateContributions', () => {
          it('returns an error', async () => {
            await expect(
              mutate({
                mutation: adminCreateContributions,
                variables: { pendingCreations: [variables] },
              }),
            ).resolves.toEqual(
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

        describe('listUnconfirmedContributions', () => {
          it('returns an error', async () => {
            await expect(
              query({
                query: listUnconfirmedContributions,
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
          admin = await userFactory(testEnv, peterLustig)
          await mutate({
            mutation: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        describe('adminCreateContribution', () => {
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
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
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
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError('This user was deleted. Cannot create a contribution.'),
                  ],
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
              await expect(
                mutate({ mutation: adminCreateContribution, variables }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [
                    new GraphQLError('Contribution could not be saved, Email is not activated'),
                  ],
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
                  mutate({ mutation: adminCreateContribution, variables }),
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
                  mutate({ mutation: adminCreateContribution, variables }),
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
                  mutate({ mutation: adminCreateContribution, variables }),
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
                  mutate({ mutation: adminCreateContribution, variables }),
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
                  mutate({ mutation: adminCreateContribution, variables }),
                ).resolves.toEqual(
                  expect.objectContaining({
                    data: {
                      adminCreateContribution: [1000, 1000, 800],
                    },
                  }),
                )
              })
            })

            describe('second creation surpasses the available amount ', () => {
              it('returns an array of the open creations for the last three months', async () => {
                variables.amount = new Decimal(1000)
                await expect(
                  mutate({ mutation: adminCreateContribution, variables }),
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

        describe('adminCreateContributions', () => {
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
                mutation: adminCreateContributions,
                variables: { pendingCreations: massCreationVariables },
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  adminCreateContributions: {
                    success: true,
                    successfulContribution: ['bibi@bloxberg.de', 'peter@lustig.de'],
                    failedContribution: [
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

        describe('adminUpdateContribution', () => {
          // at this I expect to have this data in DB:
          // bibi@bloxberg.de: [1000, 1000, 300]
          // peter@lustig.de: [1000, 600, 500]
          // stephen@hawking.uk: [1000, 1000, 1000] - deleted
          // garrick@ollivander.com: [1000, 1000, 1000] - not activated

          describe('user for creation to update does not exist', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
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
                  errors: [
                    new GraphQLError('Could not find UserContact with email: bob@baumeister.de'),
                  ],
                }),
              )
            })
          })

          describe('user for creation to update is deleted', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: adminUpdateContribution,
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
                  mutation: adminUpdateContribution,
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
                  mutation: adminUpdateContribution,
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
                  mutation: adminUpdateContribution,
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
                  mutation: adminUpdateContribution,
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
                    adminUpdateContribution: {
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
                  mutation: adminUpdateContribution,
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
                    adminUpdateContribution: {
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

        describe('listUnconfirmedContributions', () => {
          it('returns four pending creations', async () => {
            await expect(
              query({
                query: listUnconfirmedContributions,
              }),
            ).resolves.toEqual(
              expect.objectContaining({
                data: {
                  listUnconfirmedContributions: expect.arrayContaining([
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

        describe('adminDeleteContribution', () => {
          describe('creation id does not exist', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
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
          })

          describe('creation id does exist', () => {
            it('returns true', async () => {
              await expect(
                mutate({
                  mutation: adminDeleteContribution,
                  variables: {
                    id: creation ? creation.id : -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  data: { adminDeleteContribution: true },
                }),
              )
            })
          })
        })

        describe('confirmContribution', () => {
          describe('creation does not exits', () => {
            it('throws an error', async () => {
              await expect(
                mutate({
                  mutation: confirmContribution,
                  variables: {
                    id: -1,
                  },
                }),
              ).resolves.toEqual(
                expect.objectContaining({
                  errors: [new GraphQLError('Contribution not found to given id.')],
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

            it('calls sendContributionConfirmedEmail', async () => {
              expect(sendContributionConfirmedEmail).toBeCalledWith(
                expect.objectContaining({
                  contributionMemo: 'Herzlich Willkommen bei Gradido liebe Bibi!',
                  overviewURL: 'http://localhost/overview',
                  recipientEmail: 'bibi@bloxberg.de',
                  recipientFirstName: 'Bibi',
                  recipientLastName: 'Bloxberg',
                  senderFirstName: 'Peter',
                  senderLastName: 'Lustig',
                }),
              )
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
                  // data: { confirmContribution: true },
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
    const variables = {
      amount: new Decimal(200),
      name: 'Dokumenta 2022',
      memo: 'Danke für deine Teilnahme an der Dokumenta 2022',
      cycle: 'once',
      validFrom: new Date(2022, 5, 18).toISOString(),
      validTo: new Date(2022, 7, 14).toISOString(),
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
                validTo: new Date('2022-08-14T00:00:00.000Z'),
                cycle: 'once',
                maxPerCycle: 1,
                totalMaxCountOfContribution: null,
                maxAccountBalance: null,
                minGapHours: null,
                createdAt: expect.any(Date),
                deletedAt: null,
                code: expect.stringMatching(/^[0-9a-f]{24,24}$/),
                linkEnabled: true,
                // amount: '200',
                // maxAmountPerMonth: '200',
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
                  // amount: '400',
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
