import * as v from 'valibot'
import { uuid4ToTopicSchema } from '../../schemas/typeConverter.schema'

export enum TransactionFormatType {
  BASE64 = 'base64',
  JSON = 'json',
}

export const transactionFormatTypeSchema = v.nullish(
  v.enum(TransactionFormatType), 
  TransactionFormatType.BASE64
)

export type TransactionFormatTypeInput = v.InferInput<typeof transactionFormatTypeSchema>

export const getTransactionsInputSchema = v.object({
  format: transactionFormatTypeSchema,
  // default value is 1, from first transactions
  fromTransactionId: v.undefinedable(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), 1),
  // default value is 100, max 100 transactions
  maxResultCount: v.undefinedable(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), 100),
  communityId: uuid4ToTopicSchema,
})

export type GetTransactionsInputType = v.InferInput<typeof getTransactionsInputSchema>

export const getTransactionInputSchema = v.object({
  transactionIdentifier: v.object({
    iotaTopic: uuid4ToTopicSchema,
    transactionNr: v.number(),
    iotaMessageId: v.string(),
  }),
})  