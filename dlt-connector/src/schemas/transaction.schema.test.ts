import { beforeAll, describe, expect, it } from 'bun:test'
import { randomBytes } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { parse } from 'valibot'
import { InputTransactionType } from '../enum/InputTransactionType'
import {
  gradidoAmountSchema,
  HieroId,
  hieroIdSchema,
  Memo,
  memoSchema,
  timeoutDurationSchema,
  Uuidv4,
  uuidv4Schema,
} from '../schemas/typeGuard.schema'
import { TransactionInput, transactionSchema } from './transaction.schema'

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
beforeAll(() => {
  topic = parse(hieroIdSchema, topicString)
})

describe('transaction schemas', () => {
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
