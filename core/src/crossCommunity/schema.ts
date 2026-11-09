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

// A link of another community, accepted by a member of the calling one: no more than what finds
// the link and the member. Who made it, the amount and the memo the link's community has itself.
export const disburseTransactionLinkWireSchema = v.object({
  link: v.object({
    // as createTransactionLink makes it: 24 hex characters
    code: v.pipe(v.string(), v.regex(/^[0-9a-f]{24}$/i)),
    communityUuid: uuidv4Schema,
  }),
  recipient: involvedParties.entries.recipient,
})

export type DisburseTransactionLinkWire = v.InferOutput<typeof disburseTransactionLinkWireSchema>
