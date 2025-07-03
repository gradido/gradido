import { describe, it, expect } from 'bun:test'
import { transactionIdentifierSchema, transactionSchema, TransactionInput, memoSchema } from './transaction.schema'
import { InputTransactionType } from '../enum/InputTransactionType'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { GradidoUnit, DurationSeconds } from 'gradido-blockchain-js'
import { randomBytes } from 'crypto'

const transactionLinkCode = (date: Date): string => {
  const time = date.getTime().toString(16)
  return (
    randomBytes(12)
      .toString('hex')
      .substring(0, 24 - time.length) + time
  )
}

describe('transaction schemas', () => {
  
  describe('transactionIdentifierSchema ', () => {
    it('valid, transaction identified by transactionNr and topic', () => {
      expect(v.parse(transactionIdentifierSchema, { 
        transactionNr: 1, 
        iotaTopic: 'c00b210fc0a189df054eb9dafb584c527e9aeb537a62a35d44667f54529c73f5' 
      })).toEqual({
        transactionNr: 1, 
        iotaMessageId: undefined, 
        iotaTopic: 'c00b210fc0a189df054eb9dafb584c527e9aeb537a62a35d44667f54529c73f5' 
      })
    })
    it('valid, transaction identified by iotaMessageId and topic', () => {
      expect(v.parse(transactionIdentifierSchema, { 
        iotaMessageId: '1b33a3cf7eb5dde04ed7ae571db1763006811ff6b7bb35b3d1c780de153af9dd', 
        iotaTopic: 'c00b210fc0a189df054eb9dafb584c527e9aeb537a62a35d44667f54529c73f5' 
      })).toEqual({
        transactionNr: 0, 
        iotaMessageId: '1b33a3cf7eb5dde04ed7ae571db1763006811ff6b7bb35b3d1c780de153af9dd', 
        iotaTopic: 'c00b210fc0a189df054eb9dafb584c527e9aeb537a62a35d44667f54529c73f5' 
      })
    })
    it('invalid, missing topic', () => {
      expect(() => v.parse(transactionIdentifierSchema, { 
        transactionNr: 1, 
        iotaMessageId: '1b33a3cf7eb5dde04ed7ae571db1763006811ff6b7bb35b3d1c780de153af9dd', 
      })).toThrowError(new Error('Invalid key: Expected "iotaTopic" but received undefined'))
    })
    it('invalid, transactionNr and iotaMessageId set', () => {
      expect(() => v.parse(transactionIdentifierSchema, { 
        transactionNr: 1, 
        iotaMessageId: '1b33a3cf7eb5dde04ed7ae571db1763006811ff6b7bb35b3d1c780de153af9dd', 
        iotaTopic: 'c00b210fc0a189df054eb9dafb584c527e9aeb537a62a35d44667f54529c73f5' 
      })).toThrowError(new Error('expect transactionNr or iotaMessageId not both'))
    })
  })

  describe('transactionSchema', () => { 
    it('valid, register new user address', () => {
      const registerAddress: TransactionInput = {
        user: { 
          communityUuid: uuidv4(), 
          account: { 
            userUuid: uuidv4(), 
          } 
        }, 
        type: InputTransactionType.REGISTER_ADDRESS, 
        createdAt: '2022-01-01T00:00:00.000Z',
      }
      expect(v.parse(transactionSchema, registerAddress)).toEqual({
        user: {
          communityUuid: registerAddress.user.communityUuid,
          account: {
            userUuid: registerAddress.user.account!.userUuid,
            accountNr: 1,
          }
        },
        type: registerAddress.type,
        createdAt: new Date(registerAddress.createdAt),
      })
    })  
    it('valid, gradido transfer', () => {
      const communityUuid = uuidv4()
      const gradidoTransfer: TransactionInput = {
        user: { 
          communityUuid, 
          account: {
            userUuid: uuidv4(), 
          } 
        }, 
        linkedUser: { 
          communityUuid, 
          account: { 
            userUuid: uuidv4(), 
          } 
        }, 
        amount: '100', 
        memo: 'TestMemo', 
        type: InputTransactionType.GRADIDO_TRANSFER, 
        createdAt: '2022-01-01T00:00:00.000Z',
      }
      expect(v.parse(transactionSchema, gradidoTransfer)).toEqual({
        user: {
          communityUuid,
          account: {
            userUuid: gradidoTransfer.user.account!.userUuid,
            accountNr: 1,
          }
        },
        linkedUser: {
          communityUuid,
          account: {
            userUuid: gradidoTransfer.linkedUser!.account!.userUuid,
            accountNr: 1,
          }
        },
        amount: GradidoUnit.fromString(gradidoTransfer.amount!),
        memo: gradidoTransfer.memo,
        type: gradidoTransfer.type,
        createdAt: new Date(gradidoTransfer.createdAt),
      })
    })

    it('valid, gradido creation', () => {
      const communityUuid = uuidv4()
      const gradidoCreation: TransactionInput = {
        user: { 
          communityUuid, 
          account: { 
            userUuid: uuidv4(), 
          } 
        }, 
        linkedUser: { 
          communityUuid, 
          account: { 
            userUuid: uuidv4(), 
          } 
        }, 
        amount: '1000', 
        memo: 'For your help', 
        type: InputTransactionType.GRADIDO_CREATION, 
        createdAt: '2022-01-01T00:00:00.000Z',
        targetDate: '2021-11-01T10:00'
      }
      expect(v.parse(transactionSchema, gradidoCreation)).toEqual({
        user: {
          communityUuid,
          account: {
            userUuid: gradidoCreation.user.account!.userUuid,
            accountNr: 1,
          }
        },
        linkedUser: {
          communityUuid,
          account: {
            userUuid: gradidoCreation.linkedUser!.account!.userUuid,
            accountNr: 1,
          }
        },
        amount: GradidoUnit.fromString(gradidoCreation.amount!),
        memo: gradidoCreation.memo,
        type: gradidoCreation.type,
        createdAt: new Date(gradidoCreation.createdAt),
        targetDate: new Date(gradidoCreation.targetDate!),
      })
    })
    it('valid, gradido transaction link / deferred transfer', () => {
      const gradidoTransactionLink: TransactionInput = {
        user: { 
          communityUuid: uuidv4(), 
          account: { 
            userUuid: uuidv4(), 
          } 
        }, 
        linkedUser: { 
          communityUuid: uuidv4(), 
          seed: { 
            seed: transactionLinkCode(new Date()), 
          } 
        }, 
        amount: '100', 
        memo: 'use link wisely', 
        type: InputTransactionType.GRADIDO_DEFERRED_TRANSFER, 
        createdAt: '2022-01-01T00:00:00.000Z',
        timeoutDuration: 60*60*24*30,
      }
      expect(v.parse(transactionSchema, gradidoTransactionLink)).toEqual({
        user: {
          communityUuid: gradidoTransactionLink.user.communityUuid,
          account: {
            userUuid: gradidoTransactionLink.user.account!.userUuid,
            accountNr: 1,
          }
        },
        linkedUser: {
          communityUuid: gradidoTransactionLink.linkedUser!.communityUuid,
          seed: {
            seed: gradidoTransactionLink.linkedUser!.seed!.seed,
          }
        },
        amount: GradidoUnit.fromString(gradidoTransactionLink.amount!),
        memo: gradidoTransactionLink.memo,
        type: gradidoTransactionLink.type,
        createdAt: new Date(gradidoTransactionLink.createdAt),
        timeoutDuration: new DurationSeconds(gradidoTransactionLink.timeoutDuration!),
      })
    })
  })
})