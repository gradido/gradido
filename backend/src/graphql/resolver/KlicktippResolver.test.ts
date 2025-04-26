/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Event as DbEvent } from '@entity/Event'
import { UserContact } from '@entity/UserContact'
import { GraphQLError } from 'graphql'

import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { i18n as localization, logger } from '@test/testSetup'

import { EventType } from '@/event/Events'
import { userFactory } from '@/seeds/factory/user'
import { login, subscribeNewsletter, unsubscribeNewsletter } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'

jest.mock('@/password/EncryptorUtils')

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

      it('stores the NEWSLETTER_SUBSCRIBE event in the database', async () => {
        const userConatct = await UserContact.findOneOrFail({
          where: { email: 'bibi@bloxberg.de' },
          relations: ['user'],
        })
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.NEWSLETTER_SUBSCRIBE,
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

      it('stores the NEWSLETTER_UNSUBSCRIBE event in the database', async () => {
        const userConatct = await UserContact.findOneOrFail({
          where: { email: 'bibi@bloxberg.de' },
          relations: ['user'],
        })
        await expect(DbEvent.find()).resolves.toContainEqual(
          expect.objectContaining({
            type: EventType.NEWSLETTER_UNSUBSCRIBE,
            affectedUserId: userConatct.user.id,
            actingUserId: userConatct.user.id,
          }),
        )
      })
    })
  })
})
