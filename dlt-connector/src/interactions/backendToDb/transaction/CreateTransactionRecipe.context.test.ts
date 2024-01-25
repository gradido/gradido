import 'reflect-metadata'
import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { TestDB } from '@test/TestDB'
import { Decimal } from 'decimal.js-light'
import { v4 } from 'uuid'

import { CONFIG } from '@/config'
import { AccountFactory } from '@/data/Account.factory'
import { KeyPair } from '@/data/KeyPair'
import { Mnemonic } from '@/data/Mnemonic'
import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { TransactionType } from '@/data/proto/3_3/enum/TransactionType'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { UserFactory } from '@/data/User.factory'
import { UserLogic } from '@/data/User.logic'
import { AccountType } from '@/graphql/enum/AccountType'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionBodyLoggingView } from '@/logging/TransactionBodyLogging.view'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'

import { AddCommunityContext } from '../community/AddCommunity.context'

import { CreateTransactionRecipeContext } from './CreateTransationRecipe.context'

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: jest.fn(() => TestDB.instance.dbConnect),
}))

CONFIG.IOTA_HOME_COMMUNITY_SEED = '034b0229a2ba4e98e1cc5e8767dca886279b484303ffa73546bd5f5bf0b71285'
const homeCommunityUuid = v4()
const foreignCommunityUuid = v4()

function createUserIdentifier(userUuid: string, communityUuid: string): UserIdentifier {
  const user = new UserIdentifier()
  user.uuid = userUuid
  user.communityUuid = communityUuid
  return user
}

const keyPair = new KeyPair(new Mnemonic(CONFIG.IOTA_HOME_COMMUNITY_SEED))
const foreignKeyPair = new KeyPair(
  new Mnemonic('5d4e163c078cc6b51f5c88f8422bc8f21d1d59a284515ab1ea79e1c176ebec50'),
)
const moderator = createUserIdentifier('ff8bbdcb-fc8b-4b5d-98e3-8bd7e1afcdbb', homeCommunityUuid)
const firstUser = createUserIdentifier('8e47e32e-0182-4099-b94d-0cac567d1392', homeCommunityUuid)
const secondUser = createUserIdentifier('9c8611dd-ee93-4cdb-a600-396c2ca91cc7', homeCommunityUuid)
const foreignUser = createUserIdentifier(
  'b0155716-5219-4c50-b3d3-0757721ae0d2',
  foreignCommunityUuid,
)

function createUserAndAccount(userIdentifier: UserIdentifier): Account {
  const accountDraft = new UserAccountDraft()
  accountDraft.user = userIdentifier
  accountDraft.createdAt = new Date().toISOString()
  accountDraft.accountType = AccountType.COMMUNITY_HUMAN
  let _keyPair: KeyPair
  if (userIdentifier.communityUuid === homeCommunityUuid) {
    _keyPair = keyPair
  } else {
    _keyPair = foreignKeyPair
  }
  const user = UserFactory.create(accountDraft, _keyPair)
  const userLogic = new UserLogic(user)
  const account = AccountFactory.createAccountFromUserAccountDraft(
    accountDraft,
    userLogic.calculateKeyPair(_keyPair),
  )
  account.user = user
  return account
}

describe('interactions/backendToDb/transaction/Create Transaction Recipe Context Test', () => {
  beforeAll(async () => {
    await TestDB.instance.setupTestDB()
    const homeCommunityDraft = new CommunityDraft()
    homeCommunityDraft.uuid = homeCommunityUuid
    homeCommunityDraft.foreign = false
    homeCommunityDraft.createdAt = '2024-01-25T13:09:55.339Z'
    let addCommunityContext = new AddCommunityContext(homeCommunityDraft)
    await addCommunityContext.run()

    const foreignCommunityDraft = new CommunityDraft()
    foreignCommunityDraft.uuid = foreignCommunityUuid
    foreignCommunityDraft.foreign = true
    foreignCommunityDraft.createdAt = '2024-01-25T13:34:28.020Z'
    addCommunityContext = new AddCommunityContext(foreignCommunityDraft)
    await addCommunityContext.run()

    const foreignCommunity = await Community.findOneOrFail({ where: { foreign: true } })
    // that isn't entirely correct, normally only the public key from foreign community is know, and will be come form blockchain
    foreignKeyPair.fillInCommunityKeys(foreignCommunity)
    foreignCommunity.save()

    const accounts = [
      createUserAndAccount(moderator),
      createUserAndAccount(firstUser),
      createUserAndAccount(secondUser),
      createUserAndAccount(foreignUser),
    ]
    await Account.save(accounts)
  })

  afterAll(async () => {
    await TestDB.instance.teardownTestDB()
  })

  it('creation transaction', async () => {
    const creationTransactionDraft = new TransactionDraft()
    creationTransactionDraft.amount = new Decimal('2000')
    creationTransactionDraft.backendTransactionId = 1
    creationTransactionDraft.createdAt = new Date().toISOString()
    creationTransactionDraft.linkedUser = moderator
    creationTransactionDraft.user = firstUser
    creationTransactionDraft.type = InputTransactionType.CREATION
    creationTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(creationTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()

    // console.log(new TransactionLoggingView(transaction))
    expect(
      transaction.signingAccount?.derive2Pubkey.compare(
        Buffer.from('19ea7313abc54f120ee0041e5b3b63e34562b0a19b96fa3e6e23cc9bff827a36', 'hex'),
      ),
    ).toBe(0)
    expect(
      transaction.recipientAccount?.derive2Pubkey.compare(
        Buffer.from('5875e1a5e101301cc774b7462566ec2d1a0b04a091dab2e32cecd713b3346224', 'hex'),
      ),
    ).toBe(0)

    expect(transaction).toMatchObject({
      type: TransactionType.GRADIDO_CREATION,
      protocolVersion: '3.3',
      community: {
        rootPubkey: Buffer.from(
          '07cbf56d4b6b7b188c5f6250c0f4a01d0e44e1d422db1935eb375319ad9f9af0',
          'hex',
        ),
        foreign: 0,
      },
      amount: new Decimal(2000),
      backendTransactions: [
        {
          typeId: InputTransactionType.CREATION,
        },
      ],
    })

    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    // console.log(new TransactionBodyLoggingView(body))
    expect(body.creation).toBeDefined()
    if (!body.creation) throw new Error()
    const bodyReceiverPubkey = Buffer.from(body.creation.recipient.pubkey)
    expect(
      bodyReceiverPubkey.compare(
        Buffer.from('5875e1a5e101301cc774b7462566ec2d1a0b04a091dab2e32cecd713b3346224', 'hex'),
      ),
    ).toBe(0)
    expect(body).toMatchObject({
      type: CrossGroupType.LOCAL,
      creation: {
        recipient: {
          amount: '2000',
        },
      },
    })
  })

  it('local send transaction', async () => {
    const sendTransactionDraft = new TransactionDraft()
    sendTransactionDraft.amount = new Decimal('100')
    sendTransactionDraft.backendTransactionId = 1
    sendTransactionDraft.createdAt = new Date().toISOString()
    sendTransactionDraft.linkedUser = secondUser
    sendTransactionDraft.user = firstUser
    sendTransactionDraft.type = InputTransactionType.SEND
    sendTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(sendTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()
    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    console.log(new TransactionBodyLoggingView(body))
    console.log(new TransactionLoggingView(transaction))
  })

  it('local recv transaction', async () => {
    const recvTransactionDraft = new TransactionDraft()
    recvTransactionDraft.amount = new Decimal('100')
    recvTransactionDraft.backendTransactionId = 1
    recvTransactionDraft.createdAt = new Date().toISOString()
    recvTransactionDraft.linkedUser = secondUser
    recvTransactionDraft.user = firstUser
    recvTransactionDraft.type = InputTransactionType.RECEIVE
    recvTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(recvTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()
    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    console.log(new TransactionBodyLoggingView(body))
    console.log(new TransactionLoggingView(transaction))
  })

  it('cross group send transaction', async () => {
    const crossGroupSendTransactionDraft = new TransactionDraft()
    crossGroupSendTransactionDraft.amount = new Decimal('100')
    crossGroupSendTransactionDraft.backendTransactionId = 1
    crossGroupSendTransactionDraft.createdAt = new Date().toISOString()
    crossGroupSendTransactionDraft.linkedUser = foreignUser
    crossGroupSendTransactionDraft.user = firstUser
    crossGroupSendTransactionDraft.type = InputTransactionType.SEND
    crossGroupSendTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(crossGroupSendTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()
    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    console.log(new TransactionBodyLoggingView(body))
    console.log(new TransactionLoggingView(transaction))
  })

  it('cross group recv transaction', async () => {
    const crossGroupRecvTransactionDraft = new TransactionDraft()
    crossGroupRecvTransactionDraft.amount = new Decimal('100')
    crossGroupRecvTransactionDraft.backendTransactionId = 1
    crossGroupRecvTransactionDraft.createdAt = new Date().toISOString()
    crossGroupRecvTransactionDraft.linkedUser = foreignUser
    crossGroupRecvTransactionDraft.user = firstUser
    crossGroupRecvTransactionDraft.type = InputTransactionType.RECEIVE
    crossGroupRecvTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(crossGroupRecvTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()
    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    console.log(new TransactionBodyLoggingView(body))
    console.log(new TransactionLoggingView(transaction))
  })
})
