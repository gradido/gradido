import { describe, expect, it, beforeAll } from 'bun:test'
import { randomBytes } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { parse } from 'valibot'
import { InputTransactionType } from '../enum/InputTransactionType'
import {
  TransactionInput,
  transactionSchema,
} from './transaction.schema'
import { transactionIdentifierSchema } from '../client/GradidoNode/input.schema'
import { 
  gradidoAmountSchema, 
  HieroId, 
  hieroIdSchema, 
  HieroTransactionId, 
  hieroTransactionIdSchema, 
  Memo, 
  memoSchema, 
  timeoutDurationSchema, 
  Uuidv4, 
  uuidv4Schema 
} from '../schemas/typeGuard.schema'

const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}
let topic: HieroId
const topicString = '0.0.261'
let hieroTransactionId: HieroTransactionId
beforeAll(() => {
  topic = parse(hieroIdSchema, topicString)
  hieroTransactionId = parse(hieroTransactionIdSchema, '0.0.261-1755348116-1281621')
})

describe('transaction schemas', () => {
  describe('transactionIdentifierSchema ', () => {
    it('valid, transaction identified by transactionNr and topic', () => {
      expect(
        parse(transactionIdentifierSchema, {
          transactionNr: 1,
          topic: topicString,
        }),
      ).toEqual({
        transactionNr: 1,
        hieroTransactionId: undefined,
        topic,
      })
    })
    it('valid, transaction identified by hieroTransactionId and topic', () => {
      expect(
        parse(transactionIdentifierSchema, {
          hieroTransactionId: '0.0.261-1755348116-1281621',
          topic: topicString,
        }),
      ).toEqual({
        hieroTransactionId,
        topic
      })
    })
    it('invalid, missing topic', () => {
      expect(() =>
        parse(transactionIdentifierSchema, {
          transactionNr: 1,
          hieroTransactionId: '0.0.261-1755348116-1281621',
        }),
      ).toThrowError(new Error('Invalid key: Expected "topic" but received undefined'))
    })
    it('invalid, transactionNr and iotaMessageId set', () => {
      expect(() =>
        parse(transactionIdentifierSchema, {
          transactionNr: 1,
          hieroTransactionId: '0.0.261-1755348116-1281621',
          topic
        }),
      ).toThrowError(new Error('expect transactionNr or hieroTransactionId not both'))
    })
  })

  describe('transactionSchema', () => {
    let userUuid: Uuidv4
    let userUuidString: string
    let memoString: string 
    let memo: Memo
    beforeAll(() => {
      userUuidString = uuidv4()
      userUuid = parse(uuidv4Schema, userUuidString)      
      memoString = 'TestMemo'
      memo = parse(memoSchema, memoString)
    })
    it('valid, register new user address', () => {
      const registerAddress: TransactionInput = {
        user: {
          communityTopicId: topicString,
          account: { userUuid: userUuidString },
        },
        type: InputTransactionType.REGISTER_ADDRESS,
        createdAt: '2022-01-01T00:00:00.000Z',
      }
      expect(parse(transactionSchema, registerAddress)).toEqual({
        user: {
          communityTopicId: topic,
          account: {
            userUuid,
            accountNr: 0,
          },
        },
        type: registerAddress.type,
        createdAt: new Date(registerAddress.createdAt),
      })
    })
    it('valid, gradido transfer', () => {
      const gradidoTransfer: TransactionInput = {
        user: {
          communityTopicId: topicString,
          account: { userUuid: userUuidString },
        },
        linkedUser: {
          communityTopicId: topicString,
          account: { userUuid: userUuidString },
        },
        amount: '100',
        memo: memoString,
        type: InputTransactionType.GRADIDO_TRANSFER,
        createdAt: '2022-01-01T00:00:00.000Z',
      }
      expect(parse(transactionSchema, gradidoTransfer)).toEqual({
        user: {
          communityTopicId: topic,
          account: {
            userUuid,
            accountNr: 0,
          },
        },
        linkedUser: {
          communityTopicId: topic,
          account: {
            userUuid,
            accountNr: 0,
          },
        },
        amount: parse(gradidoAmountSchema, gradidoTransfer.amount!),
        memo,
        type: gradidoTransfer.type,
        createdAt: new Date(gradidoTransfer.createdAt),
      })
    })

    it('valid, gradido creation', () => {
      const gradidoCreation: TransactionInput = {
        user: {
          communityTopicId: topicString,
          account: { userUuid: userUuidString },
        },
        linkedUser: {
          communityTopicId: topicString,
          account: { userUuid: userUuidString },
        },
        amount: '1000',
        memo: memoString,
        type: InputTransactionType.GRADIDO_CREATION,
        createdAt: '2022-01-01T00:00:00.000Z',
        targetDate: '2021-11-01T10:00',
      }
      expect(parse(transactionSchema, gradidoCreation)).toEqual({
        user: {
          communityTopicId: topic,
          account: { userUuid, accountNr: 0 },
        },
        linkedUser: {
          communityTopicId: topic,
          account: { userUuid, accountNr: 0 },
        },
        amount: parse(gradidoAmountSchema, gradidoCreation.amount!),
        memo,
        type: gradidoCreation.type,
        createdAt: new Date(gradidoCreation.createdAt),
        targetDate: new Date(gradidoCreation.targetDate!),
      })
    })
    it('valid, gradido transaction link / deferred transfer', () => {
      const gradidoTransactionLink: TransactionInput = {
        user: {
          communityTopicId: topicString,
          account: {
            userUuid: userUuidString,
          },
        },
        linkedUser: {
          communityTopicId: topicString,
          seed: {
            seed: transactionLinkCode(new Date()),
          },
        },
        amount: '100',
        memo: memoString,
        type: InputTransactionType.GRADIDO_DEFERRED_TRANSFER,
        createdAt: '2022-01-01T00:00:00.000Z',
        timeoutDuration: 60 * 60 * 24 * 30,
      }
      expect(parse(transactionSchema, gradidoTransactionLink)).toEqual({
        user: {
          communityTopicId: topic,
          account: {
            userUuid,
            accountNr: 0,
          },
        },
        linkedUser: {
          communityTopicId: topic,
          seed: {
            seed: gradidoTransactionLink.linkedUser!.seed!.seed,
          },
        },
        amount: parse(gradidoAmountSchema, gradidoTransactionLink.amount!),
        memo,
        type: gradidoTransactionLink.type,
        createdAt: new Date(gradidoTransactionLink.createdAt),
        timeoutDuration: parse(timeoutDurationSchema, gradidoTransactionLink.timeoutDuration!),
      })
    })
  })
})
