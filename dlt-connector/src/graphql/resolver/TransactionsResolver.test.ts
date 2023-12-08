import 'reflect-metadata'
import assert from 'assert'

import { ApolloServer } from '@apollo/server'
import { AccountType } from '@enum/AccountType'
import { TransactionResult } from '@model/TransactionResult'
// must be imported before createApolloTestServer so that TestDB was created before createApolloTestServer imports repositories
import { TestDB } from '@test/TestDB'
// eslint-disable-next-line import/order
import { createApolloTestServer } from '@test/ApolloServerMock'

import { CONFIG } from '@/config'
import { AccountFactory } from '@/data/Account.factory'
import { UserFactory } from '@/data/User.factory'
import { UserLogic } from '@/data/User.logic'
import { InputTransactionType, getTransactionTypeString } from '@/graphql/enum/InputTransactionType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { AddCommunityContext } from '@/interactions/backendToDb/community/AddCommunity.context'

CONFIG.IOTA_HOME_COMMUNITY_SEED = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899'

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

const communityUUID = '3d813cbb-37fb-42ba-91df-831e1593ac29'

const createUserStoreAccount = async (uuid: string): Promise<UserIdentifier> => {
  const userAccountDraft = new UserAccountDraft()
  userAccountDraft.accountType = AccountType.COMMUNITY_HUMAN
  userAccountDraft.createdAt = new Date().toString()
  userAccountDraft.user = new UserIdentifier()
  userAccountDraft.user.uuid = uuid
  userAccountDraft.user.communityUuid = communityUUID
  const user = UserFactory.create(userAccountDraft)
  const userLogic = new UserLogic(user)
  const account = AccountFactory.createFromUserAccountDraft(
    userAccountDraft,
    userLogic.calculateKeyPair(),
  )
  account.user = user
  // user is set to cascade: ['insert'] will be saved together with account
  await account.save()
  return userAccountDraft.user
}

describe('Transaction Resolver Test', () => {
  let senderUser: UserIdentifier
  let recipientUser: UserIdentifier
  beforeAll(async () => {
    await TestDB.instance.setupTestDB()
    apolloTestServer = await createApolloTestServer()

    const communityDraft = new CommunityDraft()
    communityDraft.uuid = communityUUID
    communityDraft.foreign = false
    communityDraft.createdAt = new Date().toString()
    const addCommunityContext = new AddCommunityContext(communityDraft)
    await addCommunityContext.run()
    senderUser = await createUserStoreAccount('0ec72b74-48c2-446f-91ce-31ad7d9f4d65')
    recipientUser = await createUserStoreAccount('ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe')
  })
  afterAll(async () => {
    await TestDB.instance.teardownTestDB()
  })

  it('test mocked sendTransaction', async () => {
    const response = await apolloTestServer.executeOperation({
      query:
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {succeed, recipe { id, topic }} }',
      variables: {
        input: {
          senderUser,
          recipientUser,
          type: getTransactionTypeString(InputTransactionType.SEND),
          amount: '10',
          createdAt: '2012-04-17T17:12:00Z',
          backendTransactionId: 1,
        },
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.errors).toBeUndefined()
    const transactionResult = response.body.singleResult.data?.sendTransaction as TransactionResult
    expect(transactionResult.recipe).toBeDefined()
    expect(transactionResult.succeed).toBe(true)
  })

  it('test mocked sendTransaction invalid transactionType ', async () => {
    const response = await apolloTestServer.executeOperation({
      query:
        'mutation ($input: TransactionDraft!) { sendTransaction(data: $input) {error {type, message}, succeed} }',
      variables: {
        input: {
          senderUser,
          recipientUser,
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
            'Variable "$input" got invalid value "INVALID" at "input.type"; Value "INVALID" does not exist in "InputTransactionType" enum.',
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
          senderUser,
          recipientUser,
          type: getTransactionTypeString(InputTransactionType.SEND),
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
          senderUser,
          recipientUser,
          type: getTransactionTypeString(InputTransactionType.SEND),
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
          senderUser,
          recipientUser,
          type: getTransactionTypeString(InputTransactionType.CREATION),
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
