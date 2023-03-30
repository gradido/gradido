import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { userFactory } from '@/seeds/factory/user'
import { logger, i18n as localization } from '@test/testSetup'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { login, subscribeNewsletter, unsubscribeNewsletter } from '@/seeds/graphql/mutations'
import { GraphQLError } from 'graphql'
import { UserContact } from '@entity/UserContact'
import { Event as DbEvent } from '@entity/Event'
import { EventType } from '@/event/Event'

let testEnv: any, mutate: any, query: any, con: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  mutate = testEnv.mutate
  query = testEnv.query
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('KlicktippResolver', () => {
  let bibi

  beforeAll(async () => {
    bibi = await userFactory(testEnv, bibiBloxberg)
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
