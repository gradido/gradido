import {
  aliasSchema,
  dateSchema,
  dateStringSchema,
  gddAmountSchema,
  gddAmountStringSchema,
  memoSchema,
  positiveIntegerSchema,
  userIdentifierSchema,
  userPublicInfoSchema,
  uuidv4Schema,
} from 'shared'

import * as v from 'valibot'

export const involvedParties = v.object({
  sender: userPublicInfoSchema,
  recipient: v.object({
    communityUuid: uuidv4Schema,
    identifier: userIdentifierSchema,
  }),
})

export type InvolvedParties = v.InferOutput<typeof involvedParties>

export const crossGroupTransactionSchema = v.object({
  ...involvedParties.entries,
  balanceDate: dateSchema,
  amount: gddAmountSchema,
  memo: memoSchema,
  transactionLinkId: v.nullish(positiveIntegerSchema),
})

export type CrossGroupTransaction = v.InferOutput<typeof crossGroupTransactionSchema>

export const userPublicInfoWireSchema = v.object({
  alias: aliasSchema,
  gradidoId: uuidv4Schema,
  communityUuid: uuidv4Schema,
  avatarUpdatedAt: v.nullish(dateStringSchema),
})

export type UserPublicInfoWire = v.InferOutput<typeof userPublicInfoWireSchema>

export const crossGroupTransactionWireSchema = v.object({
  sender: userPublicInfoWireSchema,
  recipient: v.object({
    communityUuid: uuidv4Schema,
    identifier: userIdentifierSchema,
  }),
  balanceDate: dateStringSchema,
  amount: gddAmountStringSchema,
  memo: memoSchema,
  transactionLinkId: v.nullish(positiveIntegerSchema),
})

export type CrossGroupTransactionWireInput = v.InferInput<typeof crossGroupTransactionWireSchema>
export type CrossGroupTransactionWire = v.InferOutput<typeof crossGroupTransactionWireSchema>
