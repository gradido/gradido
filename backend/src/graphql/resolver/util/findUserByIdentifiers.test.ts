import { ApolloServerTestClient } from 'apollo-server-testing'
import { Community as DbCommunity, User as DbUser } from 'database'
import { Connection } from 'typeorm'

import { cleanDB, testEnvironment } from '@test/helpers'

import { writeHomeCommunityEntry } from '@/seeds/community'
import { userFactory } from '@/seeds/factory/user'
import { bibiBloxberg } from '@/seeds/users/bibi-bloxberg'
import { bobBaumeister } from '@/seeds/users/bob-baumeister'
import { peterLustig } from '@/seeds/users/peter-lustig'

import { findUserByIdentifier } from './findUserByIdentifier'

jest.mock('@/password/EncryptorUtils')

let con: Connection
let testEnv: {
  mutate: ApolloServerTestClient['mutate']
  query: ApolloServerTestClient['query']
  con: Connection
}

beforeAll(async () => {
  testEnv = await testEnvironment()
  con = testEnv.con
  await cleanDB()
})

afterAll(async () => {
  await cleanDB()
  await con.close()
})

describe('graphql/resolver/util/findUserByIdentifier', () => {
  let homeCom: DbCommunity
  let communityUuid: string
  let communityName: string
  let userBibi: DbUser

  beforeAll(async () => {
    homeCom = await writeHomeCommunityEntry()

    communityUuid = homeCom.communityUuid!

    communityName = homeCom.communityUuid!

    userBibi = await userFactory(testEnv, bibiBloxberg)
    await userFactory(testEnv, peterLustig)
    await userFactory(testEnv, bobBaumeister)
  })

  describe('communityIdentifier is community uuid', () => {
    it('userIdentifier is gradido id', async () => {
      const user = await findUserByIdentifier(userBibi.gradidoID, communityUuid)
      user.userRoles = []
      expect(user).toMatchObject(userBibi)
    })

    it('userIdentifier is alias', async () => {
      const user = await findUserByIdentifier(userBibi.alias, communityUuid)
      user.userRoles = []
      expect(user).toMatchObject(userBibi)
    })

    it('userIdentifier is email', async () => {
      const user = await findUserByIdentifier(userBibi.emailContact.email, communityUuid)
      user.userRoles = []
      expect(user).toMatchObject(userBibi)
    })
  })

  describe('communityIdentifier is community name', () => {
    it('userIdentifier is gradido id', async () => {
      const user = await findUserByIdentifier(userBibi.gradidoID, communityName)
      user.userRoles = []
      expect(user).toMatchObject(userBibi)
    })

    it('userIdentifier is alias', async () => {
      const user = await findUserByIdentifier(userBibi.alias, communityName)
      user.userRoles = []
      expect(user).toMatchObject(userBibi)
    })

    it('userIdentifier is email', async () => {
      const user = await findUserByIdentifier(userBibi.emailContact.email, communityName)
      user.userRoles = []
      expect(user).toMatchObject(userBibi)
    })
  })
})
