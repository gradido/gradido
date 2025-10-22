import * as v from 'valibot'
import { AccountType } from '../data/AccountType.enum'
import { InputTransactionType } from '../data/InputTransactionType.enum'
import { identifierAccountSchema, identifierCommunityAccountSchema } from './account.schema'
import { addressTypeSchema, dateSchema } from './typeConverter.schema'
import {
  gradidoAmountSchema,
  hieroIdSchema,
  identifierSeedSchema,
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
  linkedUser: v.optional(identifierAccountSchema),
  amount: v.optional(gradidoAmountSchema),
  memo: v.optional(memoSchema),
  type: v.enum(InputTransactionType),
  createdAt: dateSchema,
  targetDate: v.optional(dateSchema),
  timeoutDuration: v.optional(timeoutDurationSchema),
  accountType: v.optional(v.enum(AccountType)),
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
