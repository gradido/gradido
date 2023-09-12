import 'reflect-metadata'
import { ApolloServer } from '@apollo/server'
import { createApolloTestServer } from '@test/ApolloServerMock'
import assert from 'assert'
import { init as initTestDB, DataSourceTest } from '@test/testDB'
import { TransactionResult } from '../model/TransactionResult'

let apolloTestServer: ApolloServer

jest.mock('@typeorm/DataSource', () => {
  return {
    DataSource: jest.fn().mockReturnValue(() => DataSourceTest),
  }
})

describe('graphql/resolver/CommunityResolver', () => {
  beforeAll(async () => {
    apolloTestServer = await createApolloTestServer()
    await initTestDB()
  })
  it('test version query', async () => {
    const response = await apolloTestServer.executeOperation({
      query: '{ version }',
    })
    // Note the use of Node's assert rather than Jest's expect; if using
    // TypeScript, `assert`` will appropriately narrow the type of `body`
    // and `expect` will not.
    // Source: https://www.apollographql.com/docs/apollo-server/testing/testing
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined()
    expect(response.body.singleResult.data?.version).toBe('0.1')
  })

  it('test add foreign community', async () => {
    const response = await apolloTestServer.executeOperation({
      query: 'mutation ($input: CommunityDraft!) { addCommunity(data: $input) {succeed} }',
      variables: {
        input: {
          uuid: '3d813cbb-47fb-32ba-91df-831e1593ac29',
          foreign: true,
          createdAt: '2012-04-17T17:12:00Z',
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined()
    const transactionResult = response.body.singleResult.data?.addCommunity as TransactionResult
    expect(transactionResult.succeed).toEqual(true)
  })
})
