import 'reflect-metadata'
import assert from 'assert'

import { ApolloServer } from '@apollo/server'

// must be imported before createApolloTestServer so that TestDB was created before createApolloTestServer imports repositories
import { TransactionResult } from '@model/TransactionResult'
import { createApolloTestServer } from '@test/ApolloServerMock'
import { TestDB } from '@test/TestDB'

import { CONFIG } from '@/config'

CONFIG.IOTA_HOME_COMMUNITY_SEED = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899'

const con = TestDB.instance

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: jest.fn(() => TestDB.instance.dbConnect),
}))

let apolloTestServer: ApolloServer

describe('graphql/resolver/CommunityResolver', () => {
  beforeAll(async () => {
    await con.setupTestDB()
    apolloTestServer = await createApolloTestServer()
  })
  afterAll(async () => {
    await con.teardownTestDB()
  })

  describe('tests with db', () => {
    it('test add foreign community', async () => {
      const response = await apolloTestServer.executeOperation({
        query:
          'mutation ($input: CommunityDraft!) { addCommunity(data: $input) {succeed, error {message}} }',
        variables: {
          input: {
            uuid: '3d813cbb-37fb-42ba-91df-831e1593ac29',
            foreign: true,
            createdAt: '2012-04-17T17:12:00.0012Z',
          },
        },
      })
      assert(response.body.kind === 'single')
      expect(response.body.singleResult.errors).toBeUndefined()
      const transactionResult = response.body.singleResult.data?.addCommunity as TransactionResult
      expect(transactionResult.succeed).toEqual(true)
    })

    it('test add home community', async () => {
      const response = await apolloTestServer.executeOperation({
        query:
          'mutation ($input: CommunityDraft!) { addCommunity(data: $input) {succeed, error {message}} }',
        variables: {
          input: {
            uuid: '3d823cad-37fb-41cd-91df-152e1593ac29',
            foreign: false,
            createdAt: '2012-05-12T13:12:00.2917Z',
          },
        },
      })
      assert(response.body.kind === 'single')
      expect(response.body.singleResult.errors).toBeUndefined()
      const transactionResult = response.body.singleResult.data?.addCommunity as TransactionResult
      expect(transactionResult.succeed).toEqual(true)
    })

    it('test add existing community', async () => {
      const response = await apolloTestServer.executeOperation({
        query: 'mutation ($input: CommunityDraft!) { addCommunity(data: $input) {succeed} }',
        variables: {
          input: {
            uuid: '3d823cad-37fb-41cd-91df-152e1593ac29',
            foreign: false,
            createdAt: '2012-05-12T13:12:00.1271Z',
          },
        },
      })
      assert(response.body.kind === 'single')
      expect(response.body.singleResult.errors).toBeUndefined()
      const transactionResult = response.body.singleResult.data?.addCommunity as TransactionResult
      expect(transactionResult.succeed).toEqual(false)
    })
  })
})
