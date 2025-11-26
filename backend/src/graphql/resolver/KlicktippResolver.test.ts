import { cleanDB, resetToken, testEnvironment } from '@test/helpers'
import { i18n as localization } from '@test/testSetup'
import { getLogger } from 'config-schema/test/testSetup'
import { Event as DbEvent, UserContact } from 'database'
import { GraphQLError } from 'graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { EventType } from '@/event/Events'
import { userFactory } from '@/seeds/factory/user'
import { login, subscribeNewsletter, unsubscribeNewsletter } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'

jest.mock('@/password/EncryptorUtils')

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.KlicktippResolver`)

let testEnv: any
let mutate: any
let con: any

beforeAll(async () => {
  testEnv = await testEnvironment(logger, localization)
  mutate = testEnv.mutate
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.destroy()
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
