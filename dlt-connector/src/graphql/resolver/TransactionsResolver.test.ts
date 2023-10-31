import 'reflect-metadata'
import { ApolloServer } from '@apollo/server'
import { TestDB } from '@test/TestDB'
import { createApolloTestServer } from '@test/ApolloServerMock'
import assert from 'assert'
import { TransactionResult } from '@model/TransactionResult'

let apolloTestServer: ApolloServer

jest.mock('@/client/IotaClient', () => {
  return {
    sendMessage: jest.fn().mockReturnValue({
      messageId: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    }),
  }
})

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: jest.fn(() => TestDB.instance.dbConnect),
}))

describe('Transaction Resolver Test', () => {
  beforeAll(async () => {
    apolloTestServer = await createApolloTestServer()
    await TestDB.instance.setupTestDB()
  })

  afterAll(async () => {
    await TestDB.instance.teardownTestDB()
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
          type: 'SEND',
          amount: '10',
          createdAt: '2012-04-17T17:12:00Z',
          backendTransactionId: 1,
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
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}, succeed} }',
      variables: {
        input: {
          senderUser: {
            uuid: '0ec72b74-48c2-446f-91ce-31ad7d9f4d65',
          },
          recipientUser: {
            uuid: 'ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe',
          },
          type: 'INVALID',
          amount: '10',
          createdAt: '2012-04-17T17:12:00Z',
          backendTransactionId: 1,
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
          type: 'SEND',
          amount: 'no number',
          createdAt: '2012-04-17T17:12:00Z',
          backendTransactionId: 1,
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
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}, succeed} }',
      variables: {
        input: {
          senderUser: {
            uuid: '0ec72b74-48c2-446f-91ce-31ad7d9f4d65',
          },
          recipientUser: {
            uuid: 'ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe',
          },
          type: 'SEND',
          amount: '10',
          createdAt: 'not valid',
          backendTransactionId: 1,
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
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}, succeed} }',
      variables: {
        input: {
          senderUser: {
            uuid: '0ec72b74-48c2-446f-91ce-31ad7d9f4d65',
          },
          recipientUser: {
            uuid: 'ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe',
          },
          type: 'CREATION',
          amount: '10',
          createdAt: '2012-04-17T17:12:00Z',
          backendTransactionId: 1,
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
