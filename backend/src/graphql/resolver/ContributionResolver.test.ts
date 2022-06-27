import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { createContribution } from '@/seeds/graphql/mutations'
import { login } from '@/seeds/graphql/queries'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { GraphQLError } from 'graphql'
import { User } from '@entity/User'
import { Contribution } from '@entity/Contribution'
import { userFactory } from '@/seeds/factory/user'
import { garrickOllivander } from '@/seeds/users/garrick-ollivander'
import { stephenHawking } from '@/seeds/users/stephen-hawking'

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

let user: User
let creation: Contribution | void

describe('ContributionResolver', () => {
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

    describe('authenticated with deleted user', () => {
      beforeAll(async () => {
        user = await userFactory(testEnv, stephenHawking)
        await query({
          query: login,
          variables: { email: 'stephen@hawking.uk', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      it('throws unauthorized error', async () => {
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
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated with user that has not checked his email', () => {
      beforeAll(async () => {
        user = await userFactory(testEnv, garrickOllivander)
        await query({
          query: login,
          variables: { email: 'garrick@ollivander.com', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      it('throws unauthorized error', async () => {
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
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })

    describe('authenticated with valid user', () => {
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
            errors: [new GraphQLError('No information for available creations for the given date')],
          }),
        )
      })

      it('throws error when creationDate 3 month behind', async () => {
        const date = new Date()
        date.setMonth(date.getMonth() - 3)
        await expect(
          mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test env contribution',
              creationDate: date.toString(),
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('No information for available creations for the given date')],
          }),
        )
      })

      it('creates contribution', async () => {
        await expect(
          mutate({
            mutation: createContribution,
            variables: {
              amount: 100.0,
              memo: 'Test env contribution',
              creationDate: new Date().toString(),
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            data: {
              createContribution: true,
            },
          }),
        )
      })
    })
  })
})
