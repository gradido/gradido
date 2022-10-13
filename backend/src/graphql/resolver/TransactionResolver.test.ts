/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { userFactory } from '@/seeds/factory/user'
import {
  confirmContribution,
  createContribution,
  createUser,
  sendCoins,
} from '@/seeds/graphql/mutations'
import { login } from '@/seeds/graphql/queries'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'
import { User } from '@entity/User'
import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { logger } from '@test/testSetup'
import { GraphQLError } from 'graphql'

let mutate: any, query: any, con: any
let testEnv: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger)
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

let bobData: any
let peterData: any
let user: User[]

describe('send coins', () => {
  beforeAll(async () => {
    await userFactory(testEnv, peterLustig)
    await userFactory(testEnv, bobBaumeister)

    bobData = {
      email: 'bob@baumeister.de',
      password: 'Aa12345_',
      publisherId: 1234,
    }

    peterData = {
      email: 'peter@lustig.de',
      password: 'Aa12345_',
      publisherId: 1234,
    }

    user = await User.find({ relations: ['emailContact'] })
  })

  afterAll(async () => {
    await cleanDB()
  })

  describe('wrong recipient', () => {
    it('unknown recipient', async () => {
      await mutate({
        query: login,
        variables: bobData,
      })
      expect(
        await mutate({
          mutation: sendCoins,
          variables: {
            email: 'wrong@email.com',
            amount: 100,
            memo: 'test',
          },
        }),
      ).toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('No user with this credentials')],
        }),
      )
    })

    it('deleted recipient', async () => {
      // delete bob
      const bob = await User.findOneOrFail({ id: user[1].id })
      bob.deletedAt = new Date()
      await bob.save()

      await mutate({
        query: login,
        variables: peterData,
      })

      expect(
        await mutate({
          mutation: sendCoins,
          variables: {
            email: 'bob@baumeister.de',
            amount: 100,
            memo: 'test',
          },
        }),
      ).toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('The recipient account was deleted')],
        }),
      )

      // make bob active again
      bob.deletedAt = null
      await bob.save()
    })

    it('recipient account not activated', async () => {
      resetToken()

      await mutate({
        mutation: createUser,
        variables: {
          email: 'testing@user.de',
          firstName: 'testing',
          lastName: 'user',
          language: 'de',
          publisherId: 1234,
        },
      })

      await mutate({
        query: login,
        variables: peterData,
      })

      expect(
        await mutate({
          mutation: sendCoins,
          variables: {
            email: 'testing@user.de',
            amount: 100,
            memo: 'test',
          },
        }),
      ).toEqual(
        expect.objectContaining({
          errors: [new GraphQLError('The recipient account is not activated')],
        }),
      )
    })
  })

  describe('errors in the transaction itself', () => {
    beforeAll(async () => {
      await mutate({
        query: login,
        variables: bobData,
      })
    })

    describe('sender and recipient are the same', () => {
      it('throws an error', async () => {
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'bob@baumeister.de',
              amount: 100,
              memo: 'test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('Sender and Recipient are the same.')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('Sender and Recipient are the same.')
      })
    })

    describe('memo text is too long', () => {
      it('throws an error', async () => {
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 100,
              memo: 'test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test t',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('memo text is too long (255 characters maximum)')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('memo text is too long: memo.length=256 > 255')
      })
    })

    describe('memo text is too short', () => {
      it('throws an error', async () => {
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 100,
              memo: 'test',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError('memo text is too short (5 characters minimum)')],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith('memo text is too short: memo.length=4 < 5')
      })
    })

    describe('user has not enough GDD', () => {
      it('throws an error', async () => {
        expect(
          await mutate({
            mutation: sendCoins,
            variables: {
              email: 'peter@lustig.de',
              amount: 100,
              memo: 'testing',
            },
          }),
        ).toEqual(
          expect.objectContaining({
            errors: [new GraphQLError(`user hasn't enough GDD or amount is < 0`)],
          }),
        )
      })

      it('logs the error thrown', () => {
        expect(logger.error).toBeCalledWith(
          `user hasn't enough GDD or amount is < 0 : balance=null`,
        )
      })
    })
  })

  describe('transaction correct', () => {
    it('sends the coins', async () => {
      // make Peter Lustig Admin
      const peter = await User.findOneOrFail({ id: user[0].id })
      peter.isAdmin = new Date()
      await peter.save()

      // create contribution as user bob
      const contribution = await mutate({
        mutation: createContribution,
        variables: { amount: 1000, memo: 'testing', creationDate: new Date().toISOString() },
      })

      // login as admin
      await query({ query: login, variables: peterData })

      // confirm the contribution
      await mutate({
        mutation: confirmContribution,
        variables: { id: contribution.data.createContribution.id },
      })

      // login as bob again
      await query({ query: login, variables: bobData })

      expect(
        await mutate({
          mutation: sendCoins,
          variables: {
            email: 'peter@lustig.de',
            amount: 100,
            memo: 'testing',
          },
        }),
      ).toEqual(
        expect.objectContaining({
          data: {
            sendCoins: 'true',
          },
        }),
      )
    })
  })
})
