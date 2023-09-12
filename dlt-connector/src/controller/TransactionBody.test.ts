import 'reflect-metadata'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { create, determineCrossGroupType, determineOtherGroup } from './TransactionBody'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CrossGroupType } from '@/proto/3_3/enum/CrossGroupType'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import Decimal from 'decimal.js-light'

describe('test controller/TransactionBody', () => {
  describe('test create ', () => {
    const senderUser = new UserIdentifier()
    const recipientUser = new UserIdentifier()
    it('test with contribution transaction', () => {
      const transactionDraft = new TransactionDraft()
      transactionDraft.senderUser = senderUser
      transactionDraft.recipientUser = recipientUser
      transactionDraft.type = InputTransactionType.CREATION
      transactionDraft.amount = new Decimal(1000)
      transactionDraft.createdAt = '2022-01-02T19:10:34.121'
      transactionDraft.targetDate = '2021-12-01T10:05:00.191'
      const body = create(transactionDraft)

      expect(body.creation).toBeDefined()
      expect(body).toMatchObject({
        createdAt: {
          seconds: 1641150634,
          nanoSeconds: 121000000,
        },
        versionNumber: '3.3',
        type: CrossGroupType.LOCAL,
        otherGroup: '',
        creation: {
          recipient: {
            amount: '1000',
          },
          targetDate: {
            seconds: 1638353100,
          },
        },
      })
    })
    it('test with local send transaction send part', () => {
      const transactionDraft = new TransactionDraft()
      transactionDraft.senderUser = senderUser
      transactionDraft.recipientUser = recipientUser
      transactionDraft.type = InputTransactionType.SEND
      transactionDraft.amount = new Decimal(1000)
      transactionDraft.createdAt = '2022-01-02T19:10:34.121'
      const body = create(transactionDraft)

      expect(body.transfer).toBeDefined()
      expect(body).toMatchObject({
        createdAt: {
          seconds: 1641150634,
          nanoSeconds: 121000000,
        },
        versionNumber: '3.3',
        type: CrossGroupType.LOCAL,
        otherGroup: '',
        transfer: {
          sender: {
            amount: '1000',
          },
        },
      })
    })

    it('test with local send transaction receive part', () => {
      const transactionDraft = new TransactionDraft()
      transactionDraft.senderUser = senderUser
      transactionDraft.recipientUser = recipientUser
      transactionDraft.type = InputTransactionType.RECEIVE
      transactionDraft.amount = new Decimal(1000)
      transactionDraft.createdAt = '2022-01-02T19:10:34.121'
      const body = create(transactionDraft)

      expect(body.transfer).toBeDefined()
      expect(body).toMatchObject({
        createdAt: {
          seconds: 1641150634,
          nanoSeconds: 121000000,
        },
        versionNumber: '3.3',
        type: CrossGroupType.LOCAL,
        otherGroup: '',
        transfer: {
          sender: {
            amount: '1000',
          },
        },
      })
    })
  })
  describe('test determineCrossGroupType', () => {
    const transactionDraft = new TransactionDraft()
    transactionDraft.senderUser = new UserIdentifier()
    transactionDraft.recipientUser = new UserIdentifier()

    it('local transaction', () => {
      expect(determineCrossGroupType(transactionDraft)).toEqual(CrossGroupType.LOCAL)
    })

    it('test with with invalid input', () => {
      transactionDraft.recipientUser.communityUuid = 'a72a4a4a-aa12-4f6c-b3d8-7cc65c67e24a'
      expect(() => determineCrossGroupType(transactionDraft)).toThrow(
        new TransactionError(
          TransactionErrorType.NOT_IMPLEMENTED_YET,
          'cannot determine CrossGroupType',
        ),
      )
    })

    it('inbound transaction (send to sender community)', () => {
      transactionDraft.type = InputTransactionType.SEND
      expect(determineCrossGroupType(transactionDraft)).toEqual(CrossGroupType.INBOUND)
    })

    it('outbound transaction (send to recipient community)', () => {
      transactionDraft.type = InputTransactionType.RECEIVE
      expect(determineCrossGroupType(transactionDraft)).toEqual(CrossGroupType.OUTBOUND)
    })
  })

  describe('test determineOtherGroup', () => {
    const transactionDraft = new TransactionDraft()
    transactionDraft.senderUser = new UserIdentifier()
    transactionDraft.recipientUser = new UserIdentifier()

    it('for inbound transaction, other group is from recipient, missing community id for recipient', () => {
      expect(() => determineOtherGroup(CrossGroupType.INBOUND, transactionDraft)).toThrowError(
        new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing recipient user community id for cross group transaction',
        ),
      )
    })
    it('for inbound transaction, other group is from recipient', () => {
      transactionDraft.recipientUser.communityUuid = 'b8e9f00a-5a56-4b23-8c44-6823ac9e0d2d'
      expect(determineOtherGroup(CrossGroupType.INBOUND, transactionDraft)).toEqual(
        'b8e9f00a-5a56-4b23-8c44-6823ac9e0d2d',
      )
    })

    it('for outbound transaction, other group is from sender, missing community id for sender', () => {
      expect(() => determineOtherGroup(CrossGroupType.OUTBOUND, transactionDraft)).toThrowError(
        new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing sender user community id for cross group transaction',
        ),
      )
    })

    it('for outbound transaction, other group is from sender', () => {
      transactionDraft.senderUser.communityUuid = 'a72a4a4a-aa12-4f6c-b3d8-7cc65c67e24a'
      expect(determineOtherGroup(CrossGroupType.OUTBOUND, transactionDraft)).toEqual(
        'a72a4a4a-aa12-4f6c-b3d8-7cc65c67e24a',
      )
    })
  })
})
