import 'reflect-metadata'
import { Account } from '@entity/Account'
import { Decimal } from 'decimal.js-light'
import { v4 } from 'uuid'

import { TestDB } from '@test/TestDB'

import { CONFIG } from '@/config'
import { KeyPair } from '@/data/KeyPair'
import { Mnemonic } from '@/data/Mnemonic'
import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { logger } from '@/logging/logger'

import { CreateTransactionRecipeContext } from '../backendToDb/transaction/CreateTransationRecipe.context'

import { TransmitToIotaContext } from './TransmitToIota.context'

// eslint-disable-next-line import/order
import { communitySeed } from '@test/seeding/Community.seed'
// eslint-disable-next-line import/order
import { createUserSet, UserSet } from '@test/seeding/UserSet.seed'

jest.mock('@typeorm/DataSource', () => ({
  getDataSource: jest.fn(() => TestDB.instance.dbConnect),
}))

jest.mock('@/client/IotaClient', () => {
  return {
    sendMessage: jest.fn().mockReturnValue({
      messageId: '5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710',
    }),
  }
})

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

const now = new Date()

describe('interactions/transmitToIota/TransmitToIotaContext', () => {
  beforeAll(async () => {
    await TestDB.instance.setupTestDB()
    await communitySeed(homeCommunityUuid, false)
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

  it('LOCAL transaction', async () => {
    const creationTransactionDraft = new TransactionDraft()
    creationTransactionDraft.amount = new Decimal('2000')
    creationTransactionDraft.backendTransactionId = 1
    creationTransactionDraft.createdAt = new Date().toISOString()
    creationTransactionDraft.linkedUser = moderator.identifier
    creationTransactionDraft.user = firstUser.identifier
    creationTransactionDraft.type = InputTransactionType.CREATION
    creationTransactionDraft.targetDate = new Date().toISOString()
    const transactionRecipeContext = new CreateTransactionRecipeContext(creationTransactionDraft)
    await transactionRecipeContext.run()
    const transaction = transactionRecipeContext.getTransactionRecipe()

    const context = new TransmitToIotaContext(transaction)
    const debugSpy = jest.spyOn(logger, 'debug')
    await context.run()
    expect(
      transaction.iotaMessageId?.compare(
        Buffer.from('5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710', 'hex'),
      ),
    ).toBe(0)
    expect(debugSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('transmit LOCAL transaction to iota'),
      expect.objectContaining({}),
    )
  })

  it('OUTBOUND transaction', async () => {
    const crossGroupSendTransactionDraft = new TransactionDraft()
    crossGroupSendTransactionDraft.amount = new Decimal('100')
    crossGroupSendTransactionDraft.backendTransactionId = 4
    crossGroupSendTransactionDraft.createdAt = now.toISOString()
    crossGroupSendTransactionDraft.linkedUser = foreignUser.identifier
    crossGroupSendTransactionDraft.user = firstUser.identifier
    crossGroupSendTransactionDraft.type = InputTransactionType.SEND
    const transactionRecipeContext = new CreateTransactionRecipeContext(
      crossGroupSendTransactionDraft,
    )
    await transactionRecipeContext.run()
    const transaction = transactionRecipeContext.getTransactionRecipe()
    await transaction.save()
    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    expect(body.type).toBe(CrossGroupType.OUTBOUND)
    const context = new TransmitToIotaContext(transaction)
    const debugSpy = jest.spyOn(logger, 'debug')
    await context.run()
    expect(
      transaction.iotaMessageId?.compare(
        Buffer.from('5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710', 'hex'),
      ),
    ).toBe(0)
    expect(debugSpy).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('transmit OUTBOUND transaction to iota'),
      expect.objectContaining({}),
    )
  })

  it('INBOUND transaction', async () => {
    const crossGroupRecvTransactionDraft = new TransactionDraft()
    crossGroupRecvTransactionDraft.amount = new Decimal('100')
    crossGroupRecvTransactionDraft.backendTransactionId = 5
    crossGroupRecvTransactionDraft.createdAt = now.toISOString()
    crossGroupRecvTransactionDraft.linkedUser = firstUser.identifier
    crossGroupRecvTransactionDraft.user = foreignUser.identifier
    crossGroupRecvTransactionDraft.type = InputTransactionType.RECEIVE
    const transactionRecipeContext = new CreateTransactionRecipeContext(
      crossGroupRecvTransactionDraft,
    )
    await transactionRecipeContext.run()
    const transaction = transactionRecipeContext.getTransactionRecipe()
    await transaction.save()
    // console.log(new TransactionLoggingView(transaction))
    const body = TransactionBody.fromBodyBytes(transaction.bodyBytes)
    expect(body.type).toBe(CrossGroupType.INBOUND)

    const context = new TransmitToIotaContext(transaction)
    const debugSpy = jest.spyOn(logger, 'debug')
    await context.run()
    expect(
      transaction.iotaMessageId?.compare(
        Buffer.from('5498130bc3918e1a7143969ce05805502417e3e1bd596d3c44d6a0adeea22710', 'hex'),
      ),
    ).toBe(0)
    expect(debugSpy).toHaveBeenNthCalledWith(
      7,
      expect.stringContaining('transmit INBOUND transaction to iota'),
      expect.objectContaining({}),
    )
  })
})
