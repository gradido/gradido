import 'reflect-metadata'
import assert from 'assert'

import { ApolloServer } from '@apollo/server'

// must be imported before createApolloTestServer so that TestDB was created before createApolloTestServer imports repositories
// eslint-disable-next-line import/order
import { TestDB } from '@test/TestDB'
import { AccountType } from '@enum/AccountType'
import { TransactionResult } from '@model/TransactionResult'
import { createApolloTestServer } from '@test/ApolloServerMock'

import { CONFIG } from '@/config'
import { AccountFactory } from '@/data/Account.factory'
import { KeyPair } from '@/data/KeyPair'
import { Mnemonic } from '@/data/Mnemonic'
import { UserFactory } from '@/data/User.factory'
import { UserLogic } from '@/data/User.logic'
import { AddCommunityContext } from '@/interactions/backendToDb/community/AddCommunity.context'
import { getEnumValue } from '@/utils/typeConverter'

import { InputTransactionType } from '../enum/InputTransactionType'
import { CommunityDraft } from '../input/CommunityDraft'
import { UserAccountDraft } from '../input/UserAccountDraft'
import { UserIdentifier } from '../input/UserIdentifier'

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

CONFIG.IOTA_HOME_COMMUNITY_SEED = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899'
const communityUUID = '3d813cbb-37fb-42ba-91df-831e1593ac29'
const communityKeyPair = new KeyPair(new Mnemonic(CONFIG.IOTA_HOME_COMMUNITY_SEED))

const createUserStoreAccount = async (uuid: string): Promise<UserIdentifier> => {
  const userAccountDraft = new UserAccountDraft()
  userAccountDraft.accountType = AccountType.COMMUNITY_HUMAN
  userAccountDraft.createdAt = new Date().toString()
  userAccountDraft.user = new UserIdentifier()
  userAccountDraft.user.uuid = uuid
  userAccountDraft.user.communityUuid = communityUUID
  const user = UserFactory.create(userAccountDraft, communityKeyPair)
  const userLogic = new UserLogic(user)
  const account = AccountFactory.createAccountFromUserAccountDraft(
    userAccountDraft,
    userLogic.calculateKeyPair(communityKeyPair),
  )
  account.user = user
  // user is set to cascade: ['insert'] will be saved together with account
  await account.save()
  return userAccountDraft.user
}

describe('Transaction Resolver Test', () => {
  let user: UserIdentifier
  let linkedUser: UserIdentifier
  beforeAll(async () => {
    await TestDB.instance.setupTestDB()
    apolloTestServer = await createApolloTestServer()

    const communityDraft = new CommunityDraft()
    communityDraft.uuid = communityUUID
    communityDraft.foreign = false
    communityDraft.createdAt = new Date().toString()
    const addCommunityContext = new AddCommunityContext(communityDraft)
    await addCommunityContext.run()
    user = await createUserStoreAccount('0ec72b74-48c2-446f-91ce-31ad7d9f4d65')
    linkedUser = await createUserStoreAccount('ddc8258e-fcb5-4e48-8d1d-3a07ec371dbe')
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
          user,
          linkedUser,
          type: getEnumValue(InputTransactionType, InputTransactionType.SEND),
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
          user,
          linkedUser,
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
          user,
          linkedUser,
          type: getEnumValue(InputTransactionType, InputTransactionType.SEND),
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
          user,
          linkedUser,
          type: getEnumValue(InputTransactionType, InputTransactionType.SEND),
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
          user,
          linkedUser,
          type: getEnumValue(InputTransactionType, InputTransactionType.CREATION),
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
