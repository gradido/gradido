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

const mutationQuery =
  'mutation ($input: TransactionInput!) { transmitTransaction(data: $input) { dltTransactionIdHex } }'

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
  it('test mocked transmitTransaction', async () => {
    const response = await apolloTestServer.executeOperation({
      query: mutationQuery,
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
    expect(response.body.singleResult.data?.transmitTransaction).toMatchObject({
      dltTransactionIdHex: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    })
  })

  it('test mocked transmitTransaction receive transaction', async () => {
    const response = await apolloTestServer.executeOperation({
      query: mutationQuery,
      variables: {
        input: {
          type: 'RECEIVE',
          amount: '10',
          createdAt: 1688992436,
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined()
    expect(response.body.singleResult.data?.transmitTransaction).toMatchObject({
      dltTransactionIdHex: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    })
  })

  it('test mocked transmitTransaction creation transaction', async () => {
    const response = await apolloTestServer.executeOperation({
      query: mutationQuery,
      variables: {
        input: {
          type: 'CREATION',
          amount: '10',
          createdAt: 1688992436,
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined()
    expect(response.body.singleResult.data?.transmitTransaction).toMatchObject({
      dltTransactionIdHex: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    })
  })

  it('test mocked transmitTransaction invalid transactionType ', async () => {
    const response = await apolloTestServer.executeOperation({
      query: mutationQuery,
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

  it('test mocked transmitTransaction invalid amount ', async () => {
    const response = await apolloTestServer.executeOperation({
      query: mutationQuery,
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

  it('test mocked transmitTransaction negative amount ', async () => {
    const response = await apolloTestServer.executeOperation({
      query: mutationQuery,
      variables: {
        input: {
          type: 'SEND',
          amount: '-0.10',
          createdAt: 1688992436,
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult).toMatchObject({
      errors: [{ message: 'Argument Validation Error' }],
    })
  })
  it('test mocked transmitTransaction invalid created date ', async () => {
    const response = await apolloTestServer.executeOperation({
      query: mutationQuery,
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
            'Variable "$input" got invalid value "2023-03-02T10:12:00" at "input.createdAt"; Int cannot represent non-integer value: "2023-03-02T10:12:00"',
        },
      ],
    })
  })

  it('test mocked transmitTransaction to early created date ', async () => {
    const response = await apolloTestServer.executeOperation({
      query: mutationQuery,
      variables: {
        input: {
          type: 'SEND',
          amount: '10',
          createdAt: 946684700,
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult).toMatchObject({
      errors: [{ message: 'Argument Validation Error' }],
    })
  })
})
