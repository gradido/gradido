/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Connection } from '@dbTools/typeorm'
import { Event as DbEvent } from '@entity/Event'
import { ApolloServerTestClient } from 'apollo-server-testing'

import { testEnvironment, cleanDB, resetToken } from '@test/helpers'

import { addFieldsToSubscriber } from '@/apis/KlicktippController'
import { creations } from '@/seeds/creation'
import { creationFactory } from '@/seeds/factory/creation'
import { userFactory } from '@/seeds/factory/user'
import { login } from '@/seeds/graphql/mutations'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { peterLustig } from '@/seeds/users/peter-lustig'

import { exportEventDataToKlickTipp } from './klicktipp'

import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test'

mock.module('@/apis/KlicktippController')
mock.module('@/password/EncryptorUtils')

let mutate: ApolloServerTestClient['mutate'], con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  mutate = testEnv.mutate
  con = testEnv.con
  await DbEvent.clear()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('klicktipp', () => {
  beforeAll(async () => {
    await userFactory(testEnv, bibiBloxberg)
    await userFactory(testEnv, peterLustig)
    const bibisCreation = creations.find((creation) => creation.email === 'bibi@bloxberg.de')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
