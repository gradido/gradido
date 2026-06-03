import { t } from 'elysia'
import * as v from 'valibot'
import { hex32Schema, uuidv4Schema, amountSchema, hieroTransactionIdStringSchema } from '../schemas/typeGuard.schema'
import { dateStringSchema } from '../schemas/typeConverter.schema'
import { TransactionType } from '../data/TransactionType.enum'

export const existTypeBoxSchema = t.Object({
  exists: t.Boolean(),
})

export const transactionPartySchema = v.object({
  publicKey: hex32Schema,
  communityUuid: uuidv4Schema,
  finalBalance: amountSchema,
})

export type TransactionPartyInput = v.InferInput<typeof transactionPartySchema>
export type TransactionParty = v.InferOutput<typeof transactionPartySchema>

export const checkedTransactionSchema = v.object({
  valid: v.boolean(),
  error: v.optional(v.nullable(v.string()), null),
  amount: v.optional(v.nullable(amountSchema), null),
  createdAt: v.optional(v.nullable(dateStringSchema), null),
  confirmedAt: v.optional(v.nullable(dateStringSchema), null),
  hieroTransactionId: v.optional(v.nullable(hieroTransactionIdStringSchema), null),
  recipient: v.optional(v.nullable(transactionPartySchema), null),
  sender: v.optional(v.nullable(transactionPartySchema), null),
  transactionType: v.optional(v.nullable(v.enum(TransactionType)), null),
})


export type CheckedTransactionInput = v.InferInput<typeof checkedTransactionSchema>
export type CheckedTransaction = v.InferOutput<typeof checkedTransactionSchema>

