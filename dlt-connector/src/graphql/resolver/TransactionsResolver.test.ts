import 'reflect-metadata'
import { ApolloServer } from '@apollo/server'
import { createApolloTestServer } from '@test/ApolloServerMock'
import assert from 'assert'
import { TransactionResult } from '../model/TransactionResult'

let apolloTestServer: ApolloServer

jest.mock('@/client/IotaClient', () => {
  return {
    sendMessage: jest.fn().mockReturnValue({
      messageId: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    }),
  }
})

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
      query:
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}, succeed} }',
      variables: {
        input: {
          senderUser: {
            uuid: '0ec72b74-48c2-446f-91ce-31ad7d9f4d65',
          },
          recipientUser: {
            uuid: 'ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe',
          },
          backendTransactionId: 1,
          type: 'SEND',
          amount: '10',
          createdAt: '2012-04-17T17:12:00Z',
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined()
    const transactionResult = response.body.singleResult.data?.sendTransaction as TransactionResult
    expect(transactionResult.succeed).toBe(true)
  })

  it('test mocked sendTransaction invalid transactionType ', async () => {
    const response = await apolloTestServer.executeOperation({
      query:
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}} }',
      variables: {
        input: {
          senderUser: {
            uuid: '0ec72b74-48c2-446f-91ce-31ad7d9f4d65',
          },
          recipientUser: {
            uuid: 'ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe',
          },
          backendTransactionId: 1,
          type: 'INVALID',
          amount: '10',
          createdAt: '2012-04-17T17:12:00Z',
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult).toMatchObject({
      errors: [
        {
          message:
            'Variable "$input" got invalid value "INVALID" at "input.type"; Value "INVALID" does not exist in "InputTransactionType\" enum.',
        },
      ],
    })
  })

  it('test mocked sendTransaction invalid amount ', async () => {
    const response = await apolloTestServer.executeOperation({
      query:
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}} }',
      variables: {
        input: {
          senderUser: {
            uuid: '0ec72b74-48c2-446f-91ce-31ad7d9f4d65',
          },
          recipientUser: {
            uuid: 'ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe',
          },
          backendTransactionId: 1,
          type: 'SEND',
          amount: 'no number',
          createdAt: '2012-04-17T17:12:00Z',
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
      query:
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}} }',
      variables: {
        input: {
          senderUser: {
            uuid: '0ec72b74-48c2-446f-91ce-31ad7d9f4d65',
          },
          recipientUser: {
            uuid: 'ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe',
          },
          backendTransactionId: 1,
          type: 'SEND',
          amount: '10',
          createdAt: 'not valid',
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult).toMatchObject({
      errors: [
        {
          message: 'Argument Validation Error',
          extensions: {
            code: 'BAD_USER_INPUT',
            validationErrors: [
              {
                value: 'not valid',
                property: 'createdAt',
                constraints: {
                  isValidDateString: 'createdAt must be a valid date string',
                },
              },
            ],
          },
        },
      ],
    })
  })
  it('test mocked sendTransaction missing creationDate for contribution', async () => {
    const response = await apolloTestServer.executeOperation({
      query:
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}} }',
      variables: {
        input: {
          senderUser: {
            uuid: '0ec72b74-48c2-446f-91ce-31ad7d9f4d65',
          },
          recipientUser: {
            uuid: 'ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe',
          },
          backendTransactionId: 1,
          type: 'CREATION',
          amount: '10',
          createdAt: '2012-04-17T17:12:00Z',
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.data?.sendTransaction).toMatchObject({
      error: {
        type: 'MISSING_PARAMETER',
        message: 'missing targetDate for contribution',
      },
    })
  })
})
