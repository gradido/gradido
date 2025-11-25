import { ApolloServerTestClient } from 'apollo-server-testing'
import { Event as DbEvent } from 'database'
import { DataSource } from 'typeorm'
import { AppDatabase } from 'database'

import { cleanDB, resetToken, testEnvironment } from '@test/helpers'

import { addFieldsToSubscriber } from '@/apis/KlicktippController'
import { creations } from '@/seeds/creation'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

import { exportEventDataToKlickTipp } from './klicktipp'

jest.mock('@/apis/KlicktippController')
jest.mock('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate']
let con: DataSource
let db: AppDatabase
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: DataSource
  db: AppDatabase
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  con = testEnv.con
  db = testEnv.db
  await DbEvent.clear()
})

afterAll(async () => {
  await cleanDB()
  await con.destroy()
  await db.getRedisClient().quit()
})

describe('klicktipp', () => {
  beforeAll(async () => {
    await userFactory(testEnv, bibiBloxberg)
    await userFactory(testEnv, peterLustig)
    const bibisCreation = creations.find((creation) => creation.email === 'bibi@bloxberg.de')
    await creationFactory(testEnv, bibisCreation!)
    await mutate({
      mutation: login,
      variables: { email: 'bibi@bloxberg.de', password: 'Aa12345_' },
    })
  })

  afterAll(() => {
    resetToken()
  })

  describe('exportEventDataToKlickTipp', () => {
    it('calls the KlicktippController', async () => {
      await exportEventDataToKlickTipp()
      expect(addFieldsToSubscriber).toBeCalled()
    })
  })
})
