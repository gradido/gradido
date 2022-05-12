/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { testEnvironment, resetToken, cleanDB } from '@test/helpers'
import { userFactory } from '@/seeds/factory/user'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { stephenHawking } from '@/seeds/users/stephen-hawking'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { User } from '@entity/User'
import { Transaction } from '@entity/Transaction'
import { sendCoins } from '@/seeds/graphql/mutations'
import { GraphQLError } from 'graphql'
import { login } from '@/seeds/graphql/queries'

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

let adminUser: User
let user: User
let transaction: Transaction

describe('TransactionResolver', () => {
  describe('sendCoins', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: sendCoins,
            variables: {
              email: 'bibi@bloxberg.de',
              amount: 10,
              memo: 'some-memo',
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
      describe('with admin rights', () => {
        beforeAll(async () => {
          adminUser = await userFactory(testEnv, peterLustig)
          user = await userFactory(testEnv, bibiBloxberg)
          await query({
            query: login,
            variables: { email: 'peter@lustig.de', password: 'Aa12345_' },
          })
        })

        afterAll(async () => {
          await cleanDB()
          resetToken()
        })

        it('throws Error when sending to not existing user email', async () => {
          await expect(
            mutate({
              mutation: sendCoins,
              variables: { email: user.email + '.', amount: 10, memo: 'test-memo' },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [new GraphQLError('recipient not known')],
            }),
          )
        })
      })
    })
  })
})
