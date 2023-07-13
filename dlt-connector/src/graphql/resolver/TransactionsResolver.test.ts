import 'reflect-metadata'
import { ApolloServer } from '@apollo/server'
import { createApolloTestServer } from '@test/ApolloServerMock'
import assert from 'assert'

jest.mock('@/client/IotaClient', () => {
  return {
    sendMessage: jest.fn().mockReturnValue({
      messageId: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    }),
  }
})

let apolloTestServer: ApolloServer

describe('Transaction Resolver Test', () => {
  beforeAll(async () => {
    apolloTestServer = await createApolloTestServer()
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
  it('test mocked sendTransaction', async () => {
    const response = await apolloTestServer.executeOperation({
      query: 'mutation ($input: TransactionInput!) { sendTransaction(data: $input) }',
      variables: {
        input: {
          type: 'SEND',
          amount: '10',
          createdAt: 1688992436,
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined()
    expect(response.body.singleResult.data?.sendTransaction).toBe(
      '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    )
  })

  it('test mocked sendTransaction invalid transactionType ', async () => {
    const response = await apolloTestServer.executeOperation({
      query: 'mutation ($input: TransactionInput!) { sendTransaction(data: $input) }',
      variables: {
        input: {
          type: 'INVALID',
          amount: '10',
          createdAt: 1688992436,
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult).toMatchObject({
      errors: [
        {
          message:
            'Variable "$input" got invalid value "INVALID" at "input.type"; Value "INVALID" does not exist in "TransactionType" enum.',
        },
      ],
    })
  })

  it('test mocked sendTransaction invalid amount ', async () => {
    const response = await apolloTestServer.executeOperation({
      query: 'mutation ($input: TransactionInput!) { sendTransaction(data: $input) }',
      variables: {
        input: {
          type: 'SEND',
          amount: 'no number',
          createdAt: 1688992436,
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult).toMatchObject({
      errors: [
        {
          message:
            'Variable "$input" got invalid value "no number" at "input.amount"; Expected type "Decimal". [DecimalError] Invalid argument: no number',
        },
      ],
    })
  })

  it('test mocked sendTransaction invalid created date ', async () => {
    const response = await apolloTestServer.executeOperation({
      query: 'mutation ($input: TransactionInput!) { sendTransaction(data: $input) }',
      variables: {
        input: {
          type: 'SEND',
          amount: '10',
          createdAt: '2023-03-02T10:12:00',
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult).toMatchObject({
      errors: [
        {
          message:
            'Variable "$input" got invalid value "2023-03-02T10:12:00" at "input.createdAt"; Float cannot represent non numeric value: "2023-03-02T10:12:00"',
        },
      ],
    })
  })
})
