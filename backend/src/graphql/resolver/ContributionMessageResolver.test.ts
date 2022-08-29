/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { GraphQLError } from 'graphql'
import { createContributionMessage } from '@/seeds/graphql/mutations'
import { listContributionMessages, login } from '@/seeds/graphql/queries'
import { userFactory } from '@/seeds/factory/user'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'

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

describe('ContributionMessageResolver', () => {
  describe('createContributionMessage', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: createContributionMessage,
            variables: { contributionId: 1, message: 'This is a test message' },
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
        await query({
          query: login,
          variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
        })
      })

      afterAll(async () => {
        await cleanDB()
        resetToken()
      })

      describe('input not valid', () => {
        it('throws error when contribution does not exist', async () => {
          await expect(
            mutate({
              mutation: createContributionMessage,
              variables: {
                contributionId: -1,
                message: 'Test',
              },
            }),
          ).resolves.toEqual(
            expect.objectContaining({
              errors: [
                new GraphQLError(
                  'ContributionMessage was not successful: Error: Contribution not found',
                ),
              ],
            }),
          )
        })
      })
    })
  })

  describe('listContributionMessages', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        await expect(
          mutate({
            mutation: listContributionMessages,
            variables: { contributionId: 1 },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('401 Unauthorized')],
          }),
        )
      })
    })
  })
})
