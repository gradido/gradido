import 'reflect-metadata'
import { createApolloTestServer } from '@test/ApolloServerMock'
import assert from 'assert'

jest.mock('@iota/client', () => {
  const mockMessageSender = jest.fn().mockImplementation(() => {
    return {
      index: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      submit: jest.fn().mockReturnValue({
        messageId: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
      }),
    }
  })

  const mockClient = {
    message: mockMessageSender,
  }
  const mockClientBuilder = {
    node: jest.fn().mockReturnThis(),
    build: jest.fn(() => mockClient),
  }
  return {
    ClientBuilder: jest.fn(() => mockClientBuilder),
  }
})

describe('Transaction Resolver Test', () => {
  it('test mocked sendTransaction', async () => {
    const apolloTestServer = await createApolloTestServer()
    const response = await apolloTestServer.executeOperation({
      query: 'mutation ($input: TransactionInput!) { sendTransaction(data: $input) }',
      variables: {
        input: {
          type: 'SEND',
          amount: '10',
          created: 1688992436,
        },
      },
    })
    // Note the use of Node's assert rather than Jest's expect; if using
    // TypeScript, `assert`` will appropriately narrow the type of `body`
    // and `expect` will not.
    // Source: https://www.apollographql.com/docs/apollo-server/testing/testing
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined()
    expect(response.body.singleResult.data?.sendTransaction).toBe(
      '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    )
  })
})
