import * as v from 'valibot'
import { hieroTransactionIdStringSchema, uuidv4Schema } from '../../schemas/typeGuard.schema'
import { SearchDirection } from '../../data/SearchDirection.enum'
import { PublicKeySearchType } from '../../data/PublicKeySearchType.enum'
import { WireOutputFormat } from '../../data/WireOutputFormat.enum'
import { dateStringSchema } from '../../schemas/typeConverter.schema'
import { TransactionType } from '../../data/TransactionType.enum'
import { hex32Schema } from '../../schemas/typeGuard.schema'

export const transactionsRangeSchema = v.object({
  // default value is 1, from first transactions
  fromTransactionId: v.nullish(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), 1),
  // default value is 100, max 100 transactions
  maxResultCount: v.nullish(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), 100),
  communityId: uuidv4Schema,
})

export type TransactionsRangeInput = v.InferInput<typeof transactionsRangeSchema>

export const PaginationSchema = v.object({
  size: v.optional(v.pipe(
    v.number(), 
    v.minValue(0, 'expect number >= 0'), 
    v.maxValue(100, 'expect number <= 100')
  ), 0),
  page: v.optional(v.pipe(
    v.number(), 
    v.minValue(0, 'expect number >= 0')
  ), 0),
})

export const TimepointIntervalSchema = v.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
})

export const blockchainFilterSchema = v.object({
  searchDirection: v.optional(v.enum(SearchDirection), SearchDirection.DESC),
  transactionType: v.optional(v.enum(TransactionType), undefined),
  publicKeySearchType: v.optional(v.enum(PublicKeySearchType), undefined),
  format: v.optional(v.enum(WireOutputFormat), WireOutputFormat.Base64),
  communityId: uuidv4Schema,
  coinCommunityId: v.optional(uuidv4Schema, undefined),
  maxTransactionNr: v.optional(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), undefined),
  minTransactionNr: v.optional(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), undefined),
  publicKey: v.optional(hex32Schema, undefined),
  pagination: v.optional(PaginationSchema, undefined),
  timepointInterval: v.optional(TimepointIntervalSchema, undefined),  
})

export type BlockchainFilterInput = v.InferInput<typeof blockchainFilterSchema>
export type BlockchainFilter = v.InferOutput<typeof blockchainFilterSchema>

// allow TransactionIdentifier to only contain either transactionNr or iotaMessageId
export const transactionIdentifierSchema = v.pipe(
  v.object({
    transactionId: v.nullish(
      v.pipe(v.number('expect number type'), v.minValue(1, 'expect number >= 1')),
      undefined,
    ),
    hieroTransactionId: v.nullish(hieroTransactionIdStringSchema, undefined),
    communityId: uuidv4Schema,
  }),
  v.custom((value: any) => {
    const setFieldsCount =
      Number(value.transactionId !== undefined) + Number(value.hieroTransactionId !== undefined)
    if (setFieldsCount !== 1) {
      return false
    }
    return true
  }, 'expect transactionNr or hieroTransactionId not both'),
)

export type TransactionIdentifierInput = v.InferInput<typeof transactionIdentifierSchema>
export type TransactionIdentifier = v.InferOutput<typeof transactionIdentifierSchema>
