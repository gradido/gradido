import * as v from 'valibot'
import { hex32Schema, iotaMessageIdSchema } from '../../schemas/typeGuard.schema'

export const transactionsRangeSchema = v.object({
  // default value is 1, from first transactions
  fromTransactionId: v.undefinedable(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), 1),
  // default value is 100, max 100 transactions
  maxResultCount: v.undefinedable(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), 100),
  topic: hex32Schema,
})

export type TransactionsRangeInput = v.InferInput<typeof transactionsRangeSchema>


// allow TransactionIdentifier to only contain either transactionNr or iotaMessageId
export const transactionIdentifierSchema = v.pipe(
  v.object({
    transactionNr: v.nullish(
      v.pipe(v.number('expect number type'), v.minValue(1, 'expect number >= 1')),
      undefined
    ),
    iotaMessageId: v.nullish(iotaMessageIdSchema, undefined),
    topic: hex32Schema,
  }),
  v.custom((value: any) => {
    const setFieldsCount = Number(value.transactionNr !== undefined) + Number(value.iotaMessageId !== undefined)
    if (setFieldsCount !== 1) {
      return false
    }
    return true
  }, 'expect transactionNr or iotaMessageId not both')
)

export type TransactionIdentifierInput = v.InferInput<typeof transactionIdentifierSchema>
export type TransactionIdentifier = v.InferOutput<typeof transactionIdentifierSchema>

