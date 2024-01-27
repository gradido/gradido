import 'reflect-metadata'
import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { User } from '@entity/User'
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
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: jest.fn(() => TestDB.instance.dbConnect),
}))

CONFIG.IOTA_HOME_COMMUNITY_SEED = '034b0229a2ba4e98e1cc5e8767dca886279b484303ffa73546bd5f5bf0b71285'
const homeCommunityUuid = v4()
const foreignCommunityUuid = v4()

type UserSet = {
  identifier: UserIdentifier
  user: User
  account: Account
}

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

function createUserSet(userUuid: string, communityUuid: string): UserSet {
  const identifier = createUserIdentifier(userUuid, communityUuid)
  const account = createUserAndAccount(identifier)
  if (!account.user) {
    throw Error('user missing')
  }
  return {
    identifier,
    account,
    user: account.user,
  }
}

let moderator: UserSet
let firstUser: UserSet
let secondUser: UserSet
let foreignUser: UserSet

const topic = iotaTopicFromCommunityUUID(homeCommunityUuid)
const foreignTopic = iotaTopicFromCommunityUUID(foreignCommunityUuid)

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

    moderator = createUserSet('ff8bbdcb-fc8b-4b5d-98e3-8bd7e1afcdbb', homeCommunityUuid)
    firstUser = createUserSet('8e47e32e-0182-4099-b94d-0cac567d1392', homeCommunityUuid)
    secondUser = createUserSet('9c8611dd-ee93-4cdb-a600-396c2ca91cc7', homeCommunityUuid)
    foreignUser = createUserSet('b0155716-5219-4c50-b3d3-0757721ae0d2', foreignCommunityUuid)

    await Account.save([
      moderator.account,
      firstUser.account,
      secondUser.account,
      foreignUser.account,
    ])
  })

  afterAll(async () => {
    await TestDB.instance.teardownTestDB()
  })

  it('creation transaction', async () => {
    const creationTransactionDraft = new TransactionDraft()
    creationTransactionDraft.amount = new Decimal('2000')
    creationTransactionDraft.backendTransactionId = 1
    creationTransactionDraft.createdAt = new Date().toISOString()
    creationTransactionDraft.linkedUser = moderator.identifier
    creationTransactionDraft.user = firstUser.identifier
    creationTransactionDraft.type = InputTransactionType.CREATION
    creationTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(creationTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()

    // console.log(new TransactionLoggingView(transaction))
    expect(transaction).toMatchObject({
      type: TransactionType.GRADIDO_CREATION,
      protocolVersion: '3.3',
      community: {
        rootPubkey: keyPair.publicKey,
        foreign: 0,
        iotaTopic: topic,
      },
      signingAccount: {
        derive2Pubkey: moderator.account.derive2Pubkey,
      },
      recipientAccount: {
        derive2Pubkey: firstUser.account.derive2Pubkey,
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
    expect(bodyReceiverPubkey.compare(firstUser.account.derive2Pubkey)).toBe(0)

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
    sendTransactionDraft.backendTransactionId = 2
    sendTransactionDraft.createdAt = new Date().toISOString()
    sendTransactionDraft.linkedUser = secondUser.identifier
    sendTransactionDraft.user = firstUser.identifier
    sendTransactionDraft.type = InputTransactionType.SEND
    sendTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(sendTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()

    // console.log(new TransactionLoggingView(transaction))
    expect(transaction).toMatchObject({
      type: TransactionType.GRADIDO_TRANSFER,
      protocolVersion: '3.3',
      community: {
        rootPubkey: keyPair.publicKey,
        foreign: 0,
        iotaTopic: topic,
      },
      signingAccount: {
        derive2Pubkey: firstUser.account.derive2Pubkey,
      },
      recipientAccount: {
        derive2Pubkey: secondUser.account.derive2Pubkey,
      },
      amount: new Decimal(100),
      backendTransactions: [
        {
          typeId: InputTransactionType.SEND,
        },
      ],
    })

    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    // console.log(new TransactionBodyLoggingView(body))
    expect(body.transfer).toBeDefined()
    if (!body.transfer) throw new Error()
    expect(Buffer.from(body.transfer.recipient).compare(secondUser.account.derive2Pubkey)).toBe(0)
    expect(Buffer.from(body.transfer.sender.pubkey).compare(firstUser.account.derive2Pubkey)).toBe(
      0,
    )
    expect(body).toMatchObject({
      type: CrossGroupType.LOCAL,
      transfer: {
        sender: {
          amount: '100',
        },
      },
    })
  })

  it('local recv transaction', async () => {
    const recvTransactionDraft = new TransactionDraft()
    recvTransactionDraft.amount = new Decimal('100')
    recvTransactionDraft.backendTransactionId = 3
    recvTransactionDraft.createdAt = new Date().toISOString()
    recvTransactionDraft.linkedUser = firstUser.identifier
    recvTransactionDraft.user = secondUser.identifier
    recvTransactionDraft.type = InputTransactionType.RECEIVE
    recvTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(recvTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()
    // console.log(new TransactionLoggingView(transaction))
    expect(transaction).toMatchObject({
      type: TransactionType.GRADIDO_TRANSFER,
      protocolVersion: '3.3',
      community: {
        rootPubkey: keyPair.publicKey,
        foreign: 0,
        iotaTopic: topic,
      },
      signingAccount: {
        derive2Pubkey: firstUser.account.derive2Pubkey,
      },
      recipientAccount: {
        derive2Pubkey: secondUser.account.derive2Pubkey,
      },
      amount: new Decimal(100),
      backendTransactions: [
        {
          typeId: InputTransactionType.RECEIVE,
        },
      ],
    })

    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    // console.log(new TransactionBodyLoggingView(body))
    expect(body.transfer).toBeDefined()
    if (!body.transfer) throw new Error()
    expect(Buffer.from(body.transfer.recipient).compare(secondUser.account.derive2Pubkey)).toBe(0)
    expect(Buffer.from(body.transfer.sender.pubkey).compare(firstUser.account.derive2Pubkey)).toBe(
      0,
    )
    expect(body).toMatchObject({
      type: CrossGroupType.LOCAL,
      transfer: {
        sender: {
          amount: '100',
        },
      },
    })
  })

  it('cross group send transaction', async () => {
    const crossGroupSendTransactionDraft = new TransactionDraft()
    crossGroupSendTransactionDraft.amount = new Decimal('100')
    crossGroupSendTransactionDraft.backendTransactionId = 4
    crossGroupSendTransactionDraft.createdAt = new Date().toISOString()
    crossGroupSendTransactionDraft.linkedUser = foreignUser.identifier
    crossGroupSendTransactionDraft.user = firstUser.identifier
    crossGroupSendTransactionDraft.type = InputTransactionType.SEND
    crossGroupSendTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(crossGroupSendTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()
    // console.log(new TransactionLoggingView(transaction))
    expect(transaction).toMatchObject({
      type: TransactionType.GRADIDO_TRANSFER,
      protocolVersion: '3.3',
      community: {
        rootPubkey: keyPair.publicKey,
        foreign: 0,
        iotaTopic: topic,
      },
      otherCommunity: {
        rootPubkey: foreignKeyPair.publicKey,
        foreign: 1,
        iotaTopic: foreignTopic,
      },
      signingAccount: {
        derive2Pubkey: firstUser.account.derive2Pubkey,
      },
      recipientAccount: {
        derive2Pubkey: foreignUser.account.derive2Pubkey,
      },
      amount: new Decimal(100),
      backendTransactions: [
        {
          typeId: InputTransactionType.SEND,
        },
      ],
    })
    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    // console.log(new TransactionBodyLoggingView(body))
    expect(body.transfer).toBeDefined()
    if (!body.transfer) throw new Error()
    expect(Buffer.from(body.transfer.recipient).compare(foreignUser.account.derive2Pubkey)).toBe(0)
    expect(Buffer.from(body.transfer.sender.pubkey).compare(firstUser.account.derive2Pubkey)).toBe(
      0,
    )
    expect(body).toMatchObject({
      type: CrossGroupType.OUTBOUND,
      transfer: {
        sender: {
          amount: '100',
        },
      },
    })
  })

  it('cross group recv transaction', async () => {
    const crossGroupRecvTransactionDraft = new TransactionDraft()
    crossGroupRecvTransactionDraft.amount = new Decimal('100')
    crossGroupRecvTransactionDraft.backendTransactionId = 5
    crossGroupRecvTransactionDraft.createdAt = new Date().toISOString()
    crossGroupRecvTransactionDraft.linkedUser = firstUser.identifier
    crossGroupRecvTransactionDraft.user = foreignUser.identifier
    crossGroupRecvTransactionDraft.type = InputTransactionType.RECEIVE
    crossGroupRecvTransactionDraft.targetDate = new Date().toISOString()
    const context = new CreateTransactionRecipeContext(crossGroupRecvTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()
    // console.log(new TransactionLoggingView(transaction))
    expect(transaction).toMatchObject({
      type: TransactionType.GRADIDO_TRANSFER,
      protocolVersion: '3.3',
      community: {
        rootPubkey: keyPair.publicKey,
        foreign: 0,
        iotaTopic: topic,
      },
      otherCommunity: {
        rootPubkey: foreignKeyPair.publicKey,
        foreign: 1,
        iotaTopic: foreignTopic,
      },
      signingAccount: {
        derive2Pubkey: firstUser.account.derive2Pubkey,
      },
      recipientAccount: {
        derive2Pubkey: foreignUser.account.derive2Pubkey,
      },
      amount: new Decimal(100),
      backendTransactions: [
        {
          typeId: InputTransactionType.RECEIVE,
        },
      ],
    })
    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    // console.log(new TransactionBodyLoggingView(body))
    expect(body.transfer).toBeDefined()
    if (!body.transfer) throw new Error()
    expect(Buffer.from(body.transfer.recipient).compare(foreignUser.account.derive2Pubkey)).toBe(0)
    expect(Buffer.from(body.transfer.sender.pubkey).compare(firstUser.account.derive2Pubkey)).toBe(
      0,
    )
    expect(body).toMatchObject({
      type: CrossGroupType.INBOUND,
      transfer: {
        sender: {
          amount: '100',
        },
      },
    })
  })
})
