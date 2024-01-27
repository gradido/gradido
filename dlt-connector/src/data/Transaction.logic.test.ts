import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'

import { logger } from '@/logging/logger'

import { CommunityRoot } from './proto/3_3/CommunityRoot'
import { CrossGroupType } from './proto/3_3/enum/CrossGroupType'
import { GradidoTransfer } from './proto/3_3/GradidoTransfer'
import { RegisterAddress } from './proto/3_3/RegisterAddress'
import { TransactionBody } from './proto/3_3/TransactionBody'
import { TransactionLogic } from './Transaction.logic'
import { GradidoCreation } from './proto/3_3/GradidoCreation'
import { GradidoDeferredTransfer } from './proto/3_3/GradidoDeferredTransfer'

let a: Transaction
let b: Transaction

describe('data/transaction.logic', () => {
  describe('isBelongTogether', () => {
    beforeEach(() => {
      const now = new Date()
      let body = new TransactionBody()
      body.type = CrossGroupType.OUTBOUND
      body.transfer = new GradidoTransfer()
      body.otherGroup = 'recipient group'

      a = new Transaction()
      a.community = new Community()
      a.communityId = 1
      a.otherCommunityId = 2
      a.id = 1
      a.signingAccountId = 1
      a.recipientAccountId = 2
      a.createdAt = now
      a.amount = new Decimal('100')
      a.signature = Buffer.alloc(64)
      a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())

      body = new TransactionBody()
      body.type = CrossGroupType.INBOUND
      body.transfer = new GradidoTransfer()
      body.otherGroup = 'sending group'

      b = new Transaction()
      b.community = new Community()
      b.communityId = 1
      b.otherCommunityId = 2
      b.id = 2
      b.signingAccountId = 1
      b.recipientAccountId = 2
      b.createdAt = now
      b.amount = new Decimal('100')
      b.signature = Buffer.alloc(64)
      b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
    })

    const spy = jest.spyOn(logger, 'info')

    it('true', () => {
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(true)
    })

    it('false because of same id', () => {
      b.id = 1
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(false)
      expect(spy).toHaveBeenLastCalledWith('id is the same, it is the same transaction!')
    })

    it('false because of different signing accounts', () => {
      b.signingAccountId = 17
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(false)
      expect(spy).toHaveBeenLastCalledWith(
        'transaction a and b are not pairs',
        expect.objectContaining({}),
      )
    })

    it('false because of different recipient accounts', () => {
      b.recipientAccountId = 21
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(false)
      expect(spy).toHaveBeenLastCalledWith(
        'transaction a and b are not pairs',
        expect.objectContaining({}),
      )
    })

    it('false because of different community ids', () => {
      b.communityId = 6
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(false)
      expect(spy).toHaveBeenLastCalledWith(
        'transaction a and b are not pairs',
        expect.objectContaining({}),
      )
    })

    it('false because of different other community ids', () => {
      b.otherCommunityId = 3
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(false)
      expect(spy).toHaveBeenLastCalledWith(
        'transaction a and b are not pairs',
        expect.objectContaining({}),
      )
    })

    it('false because of different createdAt', () => {
      b.createdAt = new Date('2021-01-01T17:12')
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(false)
      expect(spy).toHaveBeenLastCalledWith(
        'transaction a and b are not pairs',
        expect.objectContaining({}),
      )
    })

    describe('false because of mismatching cross group type', () => {
      const body = new TransactionBody()
      it('a is LOCAL', () => {
        body.type = CrossGroupType.LOCAL
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenNthCalledWith(7, 'no one can be LOCAL')
        expect(spy).toHaveBeenLastCalledWith(
          "cross group types don't match",
          expect.objectContaining({}),
        )
      })

      it('b is LOCAL', () => {
        body.type = CrossGroupType.LOCAL
        b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenNthCalledWith(9, 'no one can be LOCAL')
        expect(spy).toHaveBeenLastCalledWith(
          "cross group types don't match",
          expect.objectContaining({}),
        )
      })

      it('both are INBOUND', () => {
        body.type = CrossGroupType.INBOUND
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith(
          "cross group types don't match",
          expect.objectContaining({}),
        )
      })

      it('both are OUTBOUND', () => {
        body.type = CrossGroupType.OUTBOUND
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith(
          "cross group types don't match",
          expect.objectContaining({}),
        )
      })

      it('a is CROSS', () => {
        body.type = CrossGroupType.CROSS
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith(
          "cross group types don't match",
          expect.objectContaining({}),
        )
      })

      it('b is CROSS', () => {
        body.type = CrossGroupType.CROSS
        b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith(
          "cross group types don't match",
          expect.objectContaining({}),
        )
      })

      it('true with a as INBOUND and b as OUTBOUND', () => {
        let body = TransactionBody.fromBodyBytes(a.bodyBytes)
        body.type = CrossGroupType.INBOUND
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        body = TransactionBody.fromBodyBytes(b.bodyBytes)
        body.type = CrossGroupType.OUTBOUND
        b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(true)
      })
    })

    describe('false because of transaction type not suitable for cross group transactions', () => {
      const body = new TransactionBody()
      body.type = CrossGroupType.OUTBOUND
      it('without transaction type (broken TransactionBody)', () => {
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(() => logic.isBelongTogether(b)).toThrowError("couldn't determine transaction type")
      })

      it('not the same transaction types', () => {
        const body = new TransactionBody()
        body.type = CrossGroupType.OUTBOUND
        body.registerAddress = new RegisterAddress()
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith(
          "transaction types don't match",
          expect.objectContaining({}),
        )
      })

      it('community root cannot be a cross group transaction', () => {
        let body = new TransactionBody()
        body.type = CrossGroupType.OUTBOUND
        body.communityRoot = new CommunityRoot()
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        body = new TransactionBody()
        body.type = CrossGroupType.INBOUND
        body.communityRoot = new CommunityRoot()
        b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith(
          "TransactionType COMMUNITY_ROOT couldn't be a CrossGroup Transaction",
        )
      })

      it('Gradido Creation cannot be a cross group transaction', () => {
        let body = new TransactionBody()
        body.type = CrossGroupType.OUTBOUND
        body.creation = new GradidoCreation()
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        body = new TransactionBody()
        body.type = CrossGroupType.INBOUND
        body.creation = new GradidoCreation()
        b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith(
          "TransactionType GRADIDO_CREATION couldn't be a CrossGroup Transaction",
        )
      })

      it('Deferred Transfer cannot be a cross group transaction', () => {
        let body = new TransactionBody()
        body.type = CrossGroupType.OUTBOUND
        body.deferredTransfer = new GradidoDeferredTransfer()
        a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        body = new TransactionBody()
        body.type = CrossGroupType.INBOUND
        body.deferredTransfer = new GradidoDeferredTransfer()
        b.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith(
          "TransactionType GRADIDO_DEFERRED_TRANSFER couldn't be a CrossGroup Transaction",
        )
      })
    })

    describe('false because of wrong amount', () => {
      it('amount missing on a', () => {
        a.amount = undefined
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith('missing amount')
      })

      it('amount missing on b', () => {
        b.amount = undefined
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith('missing amount')
      })

      it('amount not the same', () => {
        a.amount = new Decimal('101')
        const logic = new TransactionLogic(a)
        expect(logic.isBelongTogether(b)).toBe(false)
        expect(spy).toHaveBeenLastCalledWith('amounts mismatch', expect.objectContaining({}))
      })
    })

    it('false because otherGroup are the same', () => {
      const body = new TransactionBody()
      body.type = CrossGroupType.OUTBOUND
      body.transfer = new GradidoTransfer()
      body.otherGroup = 'sending group'
      a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(false)
      expect(spy).toHaveBeenLastCalledWith('otherGroups are the same', expect.objectContaining({}))
    })

    it('false because of different memos', () => {
      const body = new TransactionBody()
      body.type = CrossGroupType.OUTBOUND
      body.transfer = new GradidoTransfer()
      body.otherGroup = 'recipient group'
      body.memo = 'changed memo'
      a.bodyBytes = Buffer.from(TransactionBody.encode(body).finish())
      const logic = new TransactionLogic(a)
      expect(logic.isBelongTogether(b)).toBe(false)
      expect(spy).toHaveBeenLastCalledWith('memo differ', expect.objectContaining({}))
    })
  })
})
