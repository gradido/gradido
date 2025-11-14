import * as v from 'valibot'
import { hieroIdSchema, hieroTransactionIdStringSchema } from '../../schemas/typeGuard.schema'

export const transactionsRangeSchema = v.object({
  // default value is 1, from first transactions
  fromTransactionId: v.nullish(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), 1),
  // default value is 100, max 100 transactions
  maxResultCount: v.nullish(v.pipe(v.number(), v.minValue(1, 'expect number >= 1')), 100),
  topic: hieroIdSchema,
})

export type TransactionsRangeInput = v.InferInput<typeof transactionsRangeSchema>

// allow TransactionIdentifier to only contain either transactionNr or iotaMessageId
export const transactionIdentifierSchema = v.pipe(
  v.object({
    transactionId: v.nullish(
      v.pipe(v.number('expect number type'), v.minValue(1, 'expect number >= 1')),
      undefined,
    ),
    hieroTransactionId: v.nullish(hieroTransactionIdStringSchema, undefined),
    topic: hieroIdSchema,
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
