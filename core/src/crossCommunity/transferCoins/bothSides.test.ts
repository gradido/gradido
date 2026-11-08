// AI-GENERATED — not an architecture reference
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import * as database from 'database'
import { PendingTransactionSelect, TransactionTypeId } from 'database'
import { GradidoUnit, PendingTransactionState, UserPublicInfo } from 'shared'
import { getLogger } from '../../../../config-schema/test/testSetup.bun'
import { LOG4JS_BASE_CATEGORY_NAME } from '../../config/const'
import { UserBalance } from '../../logic'
import { CrossCommunityErrorType } from '../errorTypes'
import { CrossGroupTransaction } from '../schema'
import { findPendingTransaction, mapToPendingTx } from './bothSides'

// Bun cannot restore a module mock (see validation/user.test.ts), so everything else stays the
// real module and no other test file finds this one in its way.
const mockFindPendingTransaction = mock(database.dbFindPendingTransaction)
mock.module('database', () => ({
  ...database,
  dbFindPendingTransaction: mockFindPendingTransaction,
}))

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.crossCommunity.transferCoins.test`)

const HOME = '11111111-1111-4111-8111-111111111111'
const PEER = '22222222-2222-4222-8222-222222222222'

const tx: CrossGroupTransaction = {
  sender: { alias: 'bibi', gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', communityUuid: HOME },
  recipient: { communityUuid: PEER, identifier: 'peter' },
  balanceDate: new Date('2026-11-08T10:00:00.123Z'),
  amount: GradidoUnit.fromNumber(12.5),
  memo: 'for the broom',
  transactionLinkId: null,
}
const recipientUser: UserPublicInfo = {
  alias: 'peter',
  gradidoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  communityUuid: PEER,
}
const balance: UserBalance = {
  balance: GradidoUnit.fromNumber(87.5),
  decay: {
    balance: GradidoUnit.fromNumber(100),
    decay: GradidoUnit.fromNumber(-0.25),
    start: new Date('2026-11-01T00:00:00.000Z'),
    end: tx.balanceDate,
    duration: null,
  },
  lastTransactionId: 7,
}

const sameAmount = (a: GradidoUnit | null, b: GradidoUnit) => a !== null && a.comparedTo(b) === 0n

describe('mapToPendingTx', () => {
  it('writes the SEND row from the sender with the recipient linked, the amount leaving', () => {
    const row = mapToPendingTx(tx, balance, recipientUser, 5, TransactionTypeId.SEND)
    expect(row).toMatchObject({
      userId: 5,
      userCommunityUuid: HOME,
      userGradidoId: tx.sender.gradidoId,
      userName: 'bibi',
      linkedUserCommunityUuid: PEER,
      linkedUserGradidoId: recipientUser.gradidoId,
      linkedUserName: 'peter',
      typeId: TransactionTypeId.SEND,
      state: PendingTransactionState.NEW,
      balanceDate: tx.balanceDate,
      memo: tx.memo,
      previous: 7,
      decayStart: balance.decay.start,
    })
    expect(sameAmount(row.amount!, GradidoUnit.fromNumber(-12.5))).toBe(true)
    expect(sameAmount(row.balance!, balance.balance)).toBe(true)
    expect(sameAmount(row.decay!, balance.decay.decay)).toBe(true)
  })

  it('writes the RECEIVE row from the recipient with the sender linked, the amount arriving', () => {
    const row = mapToPendingTx(tx, balance, recipientUser, 9, TransactionTypeId.RECEIVE)
    expect(row).toMatchObject({
      userId: 9,
      userCommunityUuid: PEER,
      userGradidoId: recipientUser.gradidoId,
      userName: 'peter',
      linkedUserCommunityUuid: HOME,
      linkedUserGradidoId: tx.sender.gradidoId,
      linkedUserName: 'bibi',
      typeId: TransactionTypeId.RECEIVE,
    })
    expect(sameAmount(row.amount!, GradidoUnit.fromNumber(12.5))).toBe(true)
  })
})

describe('findPendingTransaction', () => {
  // the row as the database hands it back after mapToPendingTx wrote it
  const written = (typeId: TransactionTypeId.SEND | TransactionTypeId.RECEIVE) =>
    ({
      id: 42,
      ...mapToPendingTx(tx, balance, recipientUser, 5, typeId),
    }) as PendingTransactionSelect

  beforeEach(() => {
    mockFindPendingTransaction.mockReset()
  })

  it('finds the SEND row it wrote: the sender as user, the recipient linked', async () => {
    mockFindPendingTransaction.mockResolvedValue(written(TransactionTypeId.SEND))

    const result = await findPendingTransaction(
      tx,
      recipientUser,
      TransactionTypeId.SEND,
      PendingTransactionState.NEW,
      logger,
    )

    expect(mockFindPendingTransaction).toHaveBeenCalledWith(
      tx.sender,
      recipientUser,
      TransactionTypeId.SEND,
      PendingTransactionState.NEW,
      tx.balanceDate,
      tx.memo,
    )
    expect(result).toMatchObject({ success: true, value: { id: 42 } })
  })

  it('finds the RECEIVE row it wrote: the recipient as user, the sender linked', async () => {
    mockFindPendingTransaction.mockResolvedValue(written(TransactionTypeId.RECEIVE))

    const result = await findPendingTransaction(
      tx,
      recipientUser,
      TransactionTypeId.RECEIVE,
      PendingTransactionState.SETTLED,
      logger,
    )

    expect(mockFindPendingTransaction).toHaveBeenCalledWith(
      recipientUser,
      tx.sender,
      TransactionTypeId.RECEIVE,
      PendingTransactionState.SETTLED,
      tx.balanceDate,
      tx.memo,
    )
    expect(result).toMatchObject({ success: true, value: { id: 42 } })
  })

  it('answers notFound without a row, and for a row over another amount', async () => {
    mockFindPendingTransaction.mockResolvedValueOnce(null)
    mockFindPendingTransaction.mockResolvedValueOnce({
      ...written(TransactionTypeId.RECEIVE),
      amount: GradidoUnit.fromNumber(12.51),
    })

    for (const _ of [1, 2]) {
      const result = await findPendingTransaction(
        tx,
        recipientUser,
        TransactionTypeId.RECEIVE,
        PendingTransactionState.NEW,
        logger,
      )
      expect(result).toMatchObject({
        success: false,
        error: { type: CrossCommunityErrorType.notFound },
      })
    }
  })
})
