import 'reflect-metadata'
import { ApolloServer } from '@apollo/server'
import { createApolloTestServer } from '@test/ApolloServerMock'
import assert from 'assert'
import { TestDB } from '@test/TestDB'
import { TransactionResult } from '../model/TransactionResult'

let apolloTestServer: ApolloServer

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: () => TestDB.instance.dbConnect,
}))

describe('graphql/resolver/CommunityResolver', () => {
  beforeAll(async () => {
    apolloTestServer = await createApolloTestServer()
  })

  describe('tests with db', () => {
    beforeAll(async () => {
      await TestDB.instance.setupTestDB()
      // apolloTestServer = await createApolloTestServer()
    })

    afterAll(async () => {
      await TestDB.instance.teardownTestDB()
    })

    it('test add foreign community', async () => {
      const response = await apolloTestServer.executeOperation({
        query: 'mutation ($input: CommunityDraft!) { addCommunity(data: $input) {succeed} }',
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
        query: 'mutation ($input: CommunityDraft!) { addCommunity(data: $input) {succeed} }',
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
