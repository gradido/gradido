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
  senderUser: userPublicInfoWireSchema,
  recipientUser: v.object({
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

export const crossGroupTransactionForeignUserInfo = v.object({
  recipientUser: userPublicInfoSchema,
  /**
   * When the recipient last changed the picture members may see
   *
   * null: no date to send -- the recipient has nothing to show (no picture, switch off), or the
   * date could not be read. Left out: the answer comes from a server that does not know the
   * field. JSON drops an undefined value, so the key is then missing on the sender's side.
   */
  recipientAvatarUpdatedAt: v.nullish(dateStringSchema),
})

export type CrossGroupTransactionForeignUserInfoInput = v.InferInput<
  typeof crossGroupTransactionForeignUserInfo
>
export type CrossGroupTransactionForeignUserInfo = v.InferOutput<
  typeof crossGroupTransactionForeignUserInfo
>
