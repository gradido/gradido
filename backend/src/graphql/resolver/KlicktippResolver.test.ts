/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Event as DbEvent } from '@entity/Event'
import { UserContact } from '@entity/UserContact'
import { GraphQLError } from 'graphql'

import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { logger, i18n as localization } from '@test/testSetup'

import { EventType } from '@/event/Event'
import { userFactory } from '@/seeds/factory/user'
import { login, subscribeNewsletter, unsubscribeNewsletter } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'

let testEnv: any, mutate: any, con: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  mutate = testEnv.mutate
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('KlicktippResolver', () => {
  beforeAll(async () => {
    await userFactory(testEnv, bibiBloxberg)
  })

  afterAll(async () => {
    await cleanDB()
  })

  describe('subscribeNewsletter', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        const { errors: errorObjects }: { errors: [GraphQLError] } = await mutate({
          mutation: subscribeNewsletter,
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

      it('calls API', async () => {
        const {
          data: { subscribeNewsletter: isSubscribed },
        }: { data: { subscribeNewsletter: boolean } } = await mutate({
          mutation: subscribeNewsletter,
        })

        expect(isSubscribed).toEqual(true)
      })

      it('stores the SUBSCRIBE_NEWSLETTER event in the database', async () => {
        const userConatct = await UserContact.findOneOrFail(
          { email: 'bibi@bloxberg.de' },
          { relations: ['user'] },
        )
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.SUBSCRIBE_NEWSLETTER,
            affectedUserId: userConatct.user.id,
            actingUserId: userConatct.user.id,
          }),
        )
      })
    })
  })

  describe('unsubscribeNewsletter', () => {
    describe('unauthenticated', () => {
      it('returns an error', async () => {
        const { errors: errorObjects }: { errors: [GraphQLError] } = await mutate({
          mutation: unsubscribeNewsletter,
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

      it('calls API', async () => {
        const {
          data: { unsubscribeNewsletter: isUnsubscribed },
        }: { data: { unsubscribeNewsletter: boolean } } = await mutate({
          mutation: unsubscribeNewsletter,
        })

        expect(isUnsubscribed).toEqual(true)
      })

      it('stores the UNSUBSCRIBE_NEWSLETTER event in the database', async () => {
        const userConatct = await UserContact.findOneOrFail(
          { email: 'bibi@bloxberg.de' },
          { relations: ['user'] },
        )
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.UNSUBSCRIBE_NEWSLETTER,
            affectedUserId: userConatct.user.id,
            actingUserId: userConatct.user.id,
          }),
        )
      })
    })
  })
})
