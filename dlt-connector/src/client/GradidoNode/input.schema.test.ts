import { beforeAll, describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import {
  HieroTransactionIdString,
  Uuidv4,
  hieroIdSchema,
  hieroTransactionIdStringSchema,
  uuidv4Schema,
} from '../../schemas/typeGuard.schema'
import { transactionIdentifierSchema } from './input.schema'
import { v4 as uuidv4 } from 'uuid'

let communityId: Uuidv4
const uuidv4String = uuidv4()
let hieroTransactionId: HieroTransactionIdString
beforeAll(() => {
  communityId = v.parse(uuidv4Schema, uuidv4String)
  hieroTransactionId = v.parse(hieroTransactionIdStringSchema, '0.0.261-1755348116-1281621')
})

describe('transactionIdentifierSchema ', () => {
  it('valid, transaction identified by transactionNr and topic', () => {
    expect(
      v.parse(transactionIdentifierSchema, {
        transactionId: 1,
        communityId,
      }),
    ).toEqual({
      transactionId: 1,
      hieroTransactionId: undefined,
      communityId,
    })
  })
  it('valid, transaction identified by hieroTransactionId and topic', () => {
    expect(
      v.parse(transactionIdentifierSchema, {
        hieroTransactionId: '0.0.261-1755348116-1281621',
        communityId,
      }),
    ).toEqual({
      hieroTransactionId,
      communityId,
    })
  })
  it('invalid, missing communityId', () => {
    expect(() =>
      v.parse(transactionIdentifierSchema, {
        transactionId: 1,
        hieroTransactionId: '0.0.261-1755348116-1281621',
      }),
    ).toThrowError(new Error('Invalid key: Expected "topic" but received undefined'))
  })
  it('invalid, transactionNr and iotaMessageId set', () => {
    expect(() =>
      v.parse(transactionIdentifierSchema, {
        transactionId: 1,
        hieroTransactionId: '0.0.261-1755348116-1281621',
        communityId,
      }),
    ).toThrowError(new Error('expect transactionNr or hieroTransactionId not both'))
  })
})
