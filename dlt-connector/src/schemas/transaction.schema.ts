import * as v from 'valibot'
import { dateFromStringSchema } from './typeConverter.schema'
import { identifierAccountSchema } from './account.schema'
import { InputTransactionType } from '../enum/InputTransactionType'
import { accountTypeToAddressTypeSchema } from './typeConverter.schema'

// allow TransactionIdentifier to only contain either transactionNr or iotaMessageId
export const transactionIdentifierSchema = v.pipe(
  v.object({
    transactionNr: v.nullish(
      v.pipe(v.number('expect number type'), v.minValue(0, 'expect number >= 0')), 
      0
    ),
    iotaMessageId: v.nullish(iotaMessageIdSchema, undefined),
    communityId: uuid4ToTopicSchema,
  }),
  v.custom((value: any) => {
    const setFieldsCount = Number(value.transactionNr !== 0) + Number(value.iotaMessageId !== undefined)
    if (setFieldsCount !== 1) {
      return false
    }
    return true
  }, 'expect transactionNr or iotaMessageId not both')
)
export type TransactionIdentifierInput = v.InferInput<typeof transactionIdentifierSchema>
export type TransactionIdentifier = v.InferOutput<typeof transactionIdentifierSchema>

export const transactionSchema = v.object({
  user: identifierAccountSchema,
  linkedUser: v.nullish(identifierAccountSchema, undefined),
  amount: v.nullish(amountToGradidoUnitSchema, undefined),
  memo: v.nullish(memoSchema, undefined),
  type: v.enum(InputTransactionType),
  createdAt: dateFromStringSchema,
  targetDate: v.nullish(dateFromStringSchema, undefined),
  timeoutDuration: v.nullish(timeoutDurationSchema, undefined),
  accountType: v.nullish(accountTypeToAddressTypeSchema, undefined),
})

export type TransactionInput = v.InferInput<typeof transactionSchema>
export type Transaction = v.InferOutput<typeof transactionSchema>

export const creationTransactionSchema = v.object({
  user: identifierAccountSchema,
  linkedUser: identifierAccountSchema,
  amount: amountToGradidoUnitSchema,
  memo: memoSchema,
  createdAt: dateFromStringSchema,
  targetDate: dateFromStringSchema,
})

export type CreationTransactionInput = v.InferInput<typeof creationTransactionSchema>
export type CreationTransaction = v.InferOutput<typeof creationTransactionSchema>

export const transferTransactionSchema = v.object({
  user: identifierAccountSchema,
  linkedUser: identifierAccountSchema,
  amount: amountToGradidoUnitSchema,
  memo: memoSchema,
  createdAt: dateFromStringSchema,
})

export type TransferTransactionInput = v.InferInput<typeof transferTransactionSchema>
export type TransferTransaction = v.InferOutput<typeof transferTransactionSchema>

// linked user is later needed for move account transaction
export const registerAddressTransactionSchema = v.object({
  user: identifierAccountSchema,
  createdAt: dateFromStringSchema,
  accountType: accountTypeToAddressTypeSchema,
})

export type RegisterAddressTransactionInput = v.InferInput<typeof registerAddressTransactionSchema>
export type RegisterAddressTransaction = v.InferOutput<typeof registerAddressTransactionSchema>


export const deferredTransferTransactionSchema = v.object({
  user: identifierAccountSchema,
  linkedUser: identifierAccountSchema,
  amount: amountToGradidoUnitSchema,
  memo: memoSchema,
  createdAt: dateFromStringSchema,
  timeoutDuration: timeoutDurationSchema,
})

export type DeferredTransferTransactionInput = v.InferInput<typeof deferredTransferTransactionSchema>
export type DeferredTransferTransaction = v.InferOutput<typeof deferredTransferTransactionSchema>
