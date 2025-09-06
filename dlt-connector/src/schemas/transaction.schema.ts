import * as v from 'valibot'
import { InputTransactionType } from '../enum/InputTransactionType'
import {
  identifierAccountSchema,
  identifierCommunityAccountSchema,
  identifierSeedSchema,
} from './account.schema'
import { accountTypeSchema, addressTypeSchema, dateSchema } from './typeConverter.schema'
import {
  gradidoAmountSchema,
  hieroIdSchema,
  memoSchema,
  timeoutDurationSchema,
  uuidv4Schema,
} from './typeGuard.schema'

/**
 * Schema for community, for creating new CommunityRoot Transaction on gradido blockchain
 */
export const communitySchema = v.object({
  uuid: uuidv4Schema,
  hieroTopicId: hieroIdSchema,
  foreign: v.boolean('expect boolean type'),
  creationDate: dateSchema,
})

export type CommunityInput = v.InferInput<typeof communitySchema>
export type Community = v.InferOutput<typeof communitySchema>

export const transactionSchema = v.object({
  user: identifierAccountSchema,
  linkedUser: v.nullish(identifierAccountSchema, undefined),
  amount: v.nullish(gradidoAmountSchema, undefined),
  memo: v.nullish(memoSchema, undefined),
  type: v.enum(InputTransactionType),
  createdAt: dateSchema,
  targetDate: v.nullish(dateSchema, undefined),
  timeoutDuration: v.nullish(timeoutDurationSchema, undefined),
  accountType: v.nullish(accountTypeSchema, undefined),
})

export type TransactionInput = v.InferInput<typeof transactionSchema>
export type Transaction = v.InferOutput<typeof transactionSchema>

// if the account is identified by seed
export const seedAccountSchema = v.object({
  communityTopicId: hieroIdSchema,
  seed: identifierSeedSchema,
})

// if the account is identified by userUuid and accountNr
export const userAccountSchema = v.object({
  communityTopicId: hieroIdSchema,
  account: identifierCommunityAccountSchema,
})

export type UserAccountInput = v.InferInput<typeof userAccountSchema>
export type UserAccount = v.InferOutput<typeof userAccountSchema>

export const creationTransactionSchema = v.object({
  user: userAccountSchema,
  linkedUser: userAccountSchema,
  amount: gradidoAmountSchema,
  memo: memoSchema,
  createdAt: dateSchema,
  targetDate: dateSchema,
})

export type CreationTransactionInput = v.InferInput<typeof creationTransactionSchema>
export type CreationTransaction = v.InferOutput<typeof creationTransactionSchema>

export const transferTransactionSchema = v.object({
  user: userAccountSchema,
  linkedUser: userAccountSchema,
  amount: gradidoAmountSchema,
  memo: memoSchema,
  createdAt: dateSchema,
})

export type TransferTransactionInput = v.InferInput<typeof transferTransactionSchema>
export type TransferTransaction = v.InferOutput<typeof transferTransactionSchema>

// linked user is later needed for move account transaction
export const registerAddressTransactionSchema = v.object({
  user: userAccountSchema,
  createdAt: dateSchema,
  accountType: addressTypeSchema,
})

export type RegisterAddressTransactionInput = v.InferInput<typeof registerAddressTransactionSchema>
export type RegisterAddressTransaction = v.InferOutput<typeof registerAddressTransactionSchema>

// deferred transfer transaction: from user account to seed
export const deferredTransferTransactionSchema = v.object({
  user: userAccountSchema,
  linkedUser: seedAccountSchema,
  amount: gradidoAmountSchema,
  memo: memoSchema,
  createdAt: dateSchema,
  timeoutDuration: timeoutDurationSchema,
})

export type DeferredTransferTransactionInput = v.InferInput<
  typeof deferredTransferTransactionSchema
>
export type DeferredTransferTransaction = v.InferOutput<typeof deferredTransferTransactionSchema>

// redeem deferred transaction: from seed to user account
export const redeemDeferredTransferTransactionSchema = v.object({
  user: seedAccountSchema,
  linkedUser: userAccountSchema,
  amount: gradidoAmountSchema,
  createdAt: dateSchema,
})

export type RedeemDeferredTransferTransactionInput = v.InferInput<
  typeof redeemDeferredTransferTransactionSchema
>
export type RedeemDeferredTransferTransaction = v.InferOutput<
  typeof redeemDeferredTransferTransactionSchema
>
