import { beforeAll, describe, expect, it } from 'bun:test'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { TypeBoxFromValibot } from '@sinclair/typemap'
import { randomBytes } from 'crypto'
import { AddressType_COMMUNITY_HUMAN } from 'gradido-blockchain-js'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { AccountType } from '../enum/AccountType'
import { InputTransactionType } from '../enum/InputTransactionType'
import {
  gradidoAmountSchema,
  HieroId,
  hieroIdSchema,
  identifierSeedSchema,
  Memo,
  memoSchema,
  timeoutDurationSchema,
  Uuidv4,
  uuidv4Schema,
} from '../schemas/typeGuard.schema'
import {
  registerAddressTransactionSchema,
  TransactionInput,
  transactionSchema,
} from './transaction.schema'

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
  topic = v.parse(hieroIdSchema, topicString)
})

describe('transaction schemas', () => {
  let userUuid: Uuidv4
  let userUuidString: string
  let memoString: string
  let memo: Memo
  beforeAll(() => {
    userUuidString = uuidv4()
    userUuid = v.parse(uuidv4Schema, userUuidString)
    memoString = 'TestMemo'
    memo = v.parse(memoSchema, memoString)
  })
  describe('register address', () => {
    let registerAddress: TransactionInput
    beforeAll(() => {
      registerAddress = {
        user: {
          communityTopicId: topicString,
          account: { userUuid: userUuidString },
        },
        type: InputTransactionType.REGISTER_ADDRESS,
        accountType: AccountType.COMMUNITY_HUMAN,
        createdAt: new Date().toISOString(),
      }
    })
    it('valid transaction schema', () => {
      expect(v.parse(transactionSchema, registerAddress)).toEqual({
        user: {
          communityTopicId: topic,
          account: {
            userUuid,
            accountNr: 0,
          },
        },
        type: registerAddress.type,
        accountType: AccountType.COMMUNITY_HUMAN,
        createdAt: new Date(registerAddress.createdAt),
      })
    })
    it('valid register address schema', () => {
      expect(v.parse(registerAddressTransactionSchema, registerAddress)).toEqual({
        user: {
          communityTopicId: topic,
          account: {
            userUuid,
            accountNr: 0,
          },
        },
        accountType: AddressType_COMMUNITY_HUMAN,
        createdAt: new Date(registerAddress.createdAt),
      })
    })
    it('valid, transaction schema with typebox', () => {
      // console.log(JSON.stringify(TypeBoxFromValibot(transactionSchema), null, 2))
      const TTransactionSchema = TypeBoxFromValibot(transactionSchema)
      const check = TypeCompiler.Compile(TTransactionSchema)
      expect(check.Check(registerAddress)).toBe(true)
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
    expect(v.parse(transactionSchema, gradidoTransfer)).toEqual({
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
      amount: v.parse(gradidoAmountSchema, gradidoTransfer.amount!),
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
    expect(v.parse(transactionSchema, gradidoCreation)).toEqual({
      user: {
        communityTopicId: topic,
        account: { userUuid, accountNr: 0 },
      },
      linkedUser: {
        communityTopicId: topic,
        account: { userUuid, accountNr: 0 },
      },
      amount: v.parse(gradidoAmountSchema, gradidoCreation.amount!),
      memo,
      type: gradidoCreation.type,
      createdAt: new Date(gradidoCreation.createdAt),
      targetDate: new Date(gradidoCreation.targetDate!),
    })
  })
  it('valid, gradido transaction link / deferred transfer', () => {
    const seed = transactionLinkCode(new Date())
    const seedParsed = v.parse(identifierSeedSchema, seed)
    const gradidoTransactionLink: TransactionInput = {
      user: {
        communityTopicId: topicString,
        account: {
          userUuid: userUuidString,
        },
      },
      linkedUser: {
        communityTopicId: topicString,
        seed,
      },
      amount: '100',
      memo: memoString,
      type: InputTransactionType.GRADIDO_DEFERRED_TRANSFER,
      createdAt: '2022-01-01T00:00:00.000Z',
      timeoutDuration: 60 * 60 * 24 * 30,
    }
    expect(v.parse(transactionSchema, gradidoTransactionLink)).toEqual({
      user: {
        communityTopicId: topic,
        account: {
          userUuid,
          accountNr: 0,
        },
      },
      linkedUser: {
        communityTopicId: topic,
        seed: seedParsed,
      },
      amount: v.parse(gradidoAmountSchema, gradidoTransactionLink.amount!),
      memo,
      type: gradidoTransactionLink.type,
      createdAt: new Date(gradidoTransactionLink.createdAt),
      timeoutDuration: v.parse(timeoutDurationSchema, gradidoTransactionLink.timeoutDuration!),
    })
  })
})
