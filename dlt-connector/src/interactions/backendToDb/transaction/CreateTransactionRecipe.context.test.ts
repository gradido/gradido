import 'reflect-metadata'
import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import { Decimal } from 'decimal.js-light'
import { v4 } from 'uuid'

import { TestDB } from '@test/TestDB'

import { CONFIG } from '@/config'
import { KeyPair } from '@/data/KeyPair'
import { Mnemonic } from '@/data/Mnemonic'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'
import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { TransactionType } from '@/data/proto/3_3/enum/TransactionType'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { AccountType } from '@/graphql/enum/AccountType'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'

import { CreateTransactionRecipeContext } from './CreateTransactionRecipe.context'

// eslint-disable-next-line import/order
import { communitySeed } from '@test/seeding/Community.seed'
// eslint-disable-next-line import/order
import { createUserSet, UserSet } from '@test/seeding/UserSet.seed'

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: jest.fn(() => TestDB.instance.dbConnect),
}))

CONFIG.IOTA_HOME_COMMUNITY_SEED = '034b0229a2ba4e98e1cc5e8767dca886279b484303ffa73546bd5f5bf0b71285'
const homeCommunityUuid = v4()
const foreignCommunityUuid = v4()

const keyPair = new KeyPair(new Mnemonic(CONFIG.IOTA_HOME_COMMUNITY_SEED))
const foreignKeyPair = new KeyPair(
  new Mnemonic('5d4e163c078cc6b51f5c88f8422bc8f21d1d59a284515ab1ea79e1c176ebec50'),
)

let moderator: UserSet
let firstUser: UserSet
let secondUser: UserSet
let foreignUser: UserSet
let homeCommunity: Community

const topic = iotaTopicFromCommunityUUID(homeCommunityUuid)
const foreignTopic = iotaTopicFromCommunityUUID(foreignCommunityUuid)

describe('interactions/backendToDb/transaction/Create Transaction Recipe Context Test', () => {
  beforeAll(async () => {
    await TestDB.instance.setupTestDB()
    homeCommunity = await communitySeed(homeCommunityUuid, false)
    await communitySeed(foreignCommunityUuid, true, foreignKeyPair)

    moderator = createUserSet(homeCommunityUuid, keyPair)
    firstUser = createUserSet(homeCommunityUuid, keyPair)
    secondUser = createUserSet(homeCommunityUuid, keyPair)
    foreignUser = createUserSet(foreignCommunityUuid, foreignKeyPair)

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

  it('register address transaction', async () => {
    const userAccountDraft = new UserAccountDraft()
    userAccountDraft.accountType = AccountType.COMMUNITY_HUMAN
    userAccountDraft.createdAt = new Date().toISOString()
    userAccountDraft.user = firstUser.identifier
    const context = new CreateTransactionRecipeContext(userAccountDraft, {
      account: firstUser.account,
      community: homeCommunity,
    })
    await context.run()
    const transaction = context.getTransactionRecipe()
    expect(transaction).toMatchObject({
      type: TransactionType.REGISTER_ADDRESS,
      protocolVersion: '3.3',
      community: {
        rootPubkey: keyPair.publicKey,
        foreign: 0,
        iotaTopic: topic,
      },
      signingAccount: {
        derive2Pubkey: firstUser.account.derive2Pubkey,
      },
    })

    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    expect(body.registerAddress).toBeDefined()
    if (!body.registerAddress) throw new Error()

    expect(body).toMatchObject({
      type: CrossGroupType.LOCAL,
      registerAddress: {
        derivationIndex: 1,
        addressType: AddressType.COMMUNITY_HUMAN,
      },
    })
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
      otherGroup: foreignTopic,
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
    const context = new CreateTransactionRecipeContext(crossGroupRecvTransactionDraft)
    await context.run()
    const transaction = context.getTransactionRecipe()
    // console.log(new TransactionLoggingView(transaction))
    expect(transaction).toMatchObject({
      type: TransactionType.GRADIDO_TRANSFER,
      protocolVersion: '3.3',
      community: {
        rootPubkey: foreignKeyPair.publicKey,
        foreign: 1,
        iotaTopic: foreignTopic,
      },
      otherCommunity: {
        rootPubkey: keyPair.publicKey,
        foreign: 0,
        iotaTopic: topic,
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
      otherGroup: topic,
      transfer: {
        sender: {
          amount: '100',
        },
      },
    })
  })
})
