import { beforeAll, describe, expect, it } from 'bun:test'
import { parse } from 'valibot'
import {
  HieroId,
  HieroTransactionIdString,
  hieroIdSchema,
  hieroTransactionIdStringSchema,
} from '../../schemas/typeGuard.schema'
import { transactionIdentifierSchema } from './input.schema'

let topic: HieroId
const topicString = '0.0.261'
let hieroTransactionId: HieroTransactionIdString
beforeAll(() => {
  topic = parse(hieroIdSchema, topicString)
  hieroTransactionId = parse(hieroTransactionIdStringSchema, '0.0.261-1755348116-1281621')
})

describe('transactionIdentifierSchema ', () => {
  it('valid, transaction identified by transactionNr and topic', () => {
    expect(
      parse(transactionIdentifierSchema, {
        transactionId: 1,
        topic: topicString,
      }),
    ).toEqual({
      transactionId: 1,
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
      topic,
    })
  })
  it('invalid, missing topic', () => {
    expect(() =>
      parse(transactionIdentifierSchema, {
        transactionId: 1,
        hieroTransactionId: '0.0.261-1755348116-1281621',
      }),
    ).toThrowError(new Error('Invalid key: Expected "topic" but received undefined'))
  })
  it('invalid, transactionNr and iotaMessageId set', () => {
    expect(() =>
      parse(transactionIdentifierSchema, {
        transactionId: 1,
        hieroTransactionId: '0.0.261-1755348116-1281621',
        topic,
      }),
    ).toThrowError(new Error('expect transactionNr or hieroTransactionId not both'))
  })
})
