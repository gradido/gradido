import { ChatMessageMailState, ChatMessageNotify } from 'database'
import {
  aliasSchema,
  dateSchema,
  dateStringSchema,
  gddAmountSchema,
  gddAmountStringSchema,
  MEMBER_AVATARS_MAX_REFS,
  MESSAGE_MAX_CHARS,
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

// as createTransactionLink makes it: 24 hex characters
const transactionLinkCodeSchema = v.pipe(v.string(), v.regex(/^[0-9a-f]{24}$/i))

// A link of another community, accepted by a member of the calling one: no more than what finds
// the link and the member. Who made it, the amount and the memo the link's community has itself.
export const disburseTransactionLinkWireSchema = v.object({
  link: v.object({
    code: transactionLinkCodeSchema,
    communityUuid: uuidv4Schema,
  }),
  recipient: involvedParties.entries.recipient,
})

export type DisburseTransactionLinkWire = v.InferOutput<typeof disburseTransactionLinkWireSchema>

// A link of this community, asked for by another one, whose member holds its code.
export const transactionLinkQuestionSchema = v.object({ code: transactionLinkCodeSchema })
export type TransactionLinkQuestion = v.InferOutput<typeof transactionLinkQuestionSchema>

// What the page of a link shows to whoever holds its code, as this community's own page does:
// what became of the link, who made it, its greeting -- and, of an open link only, the maker's
// face and the greeting's photo, as base64.
export const transactionLinkWireSchema = v.object({
  amount: gddAmountSchema,
  memo: v.string(),
  createdAt: dateSchema,
  validUntil: dateSchema,
  redeemedAt: v.nullable(dateSchema),
  deletedAt: v.nullable(dateSchema),
  sender: v.object({ gradidoId: uuidv4Schema, alias: aliasSchema }),
  greeting: v.nullable(
    v.object({
      motif: v.nullable(v.string()),
      line: v.nullable(v.string()),
      recipientName: v.nullable(v.string()),
    }),
  ),
  senderAvatar: v.nullable(v.string()),
  picture: v.nullable(v.string()),
})
export type TransactionLinkWireInput = v.InferInput<typeof transactionLinkWireSchema>
export type TransactionLinkWire = v.InferOutput<typeof transactionLinkWireSchema>

// What one community asks another about the pictures of that other's members: the ids of a
// list, at most as many as the wallet shows at once, or the one member a zoom is for (AS-020).
export const memberAvatarsQuestionSchema = v.object({
  gradidoIds: v.pipe(v.array(uuidv4Schema), v.minLength(1), v.maxLength(MEMBER_AVATARS_MAX_REFS)),
})
export type MemberAvatarsQuestion = v.InferOutput<typeof memberAvatarsQuestionSchema>

export const memberAvatarFullQuestionSchema = v.object({ gradidoId: uuidv4Schema })
export type MemberAvatarFullQuestion = v.InferOutput<typeof memberAvatarFullQuestionSchema>

// A member of the calling community writes to a member of this one (E-007). The sender comes with
// the alias this community files them with where it does not know them yet (E-034).
const chatMemberSchema = v.object({ communityUuid: uuidv4Schema, gradidoId: uuidv4Schema })

// counted by code points, as the sending server counts: a pair of surrogates is one character
const chatMessageBodySchema = v.pipe(
  v.string(),
  v.check((body) => Array.from(body).length <= MESSAGE_MAX_CHARS, 'message too long'),
)

export const chatMessageWireSchema = v.object({
  sender: v.object({ ...chatMemberSchema.entries, alias: aliasSchema }),
  recipient: chatMemberSchema,
  // the uuid both copies are filed under, the sender's and this one
  messageUuid: uuidv4Schema,
  subject: v.nullable(v.string()),
  body: chatMessageBodySchema,
  // 'letter' from the form "send an e-mail": mailed whatever the recipient's quiet (E-034)
  notify: v.picklist([ChatMessageNotify.EMAIL, ChatMessageNotify.NONE, 'letter']),
  // P7b: the picture travels with the message; the receiving side checks and encodes it again
  images: v.optional(
    v.array(
      v.object({
        imageUuid: uuidv4Schema,
        width: v.number(),
        height: v.number(),
        data: v.string(),
      }),
    ),
    [],
  ),
})
export type ChatMessageWireInput = v.InferInput<typeof chatMessageWireSchema>
export type ChatMessageWire = v.InferOutput<typeof chatMessageWireSchema>

// What the receiving server answers became of the mail about the message (E-034): MAILED, MUTED,
// or null -- none asked for, or none went out.
export const chatMessageAnswerSchema = v.object({
  mailState: v.nullable(v.picklist([ChatMessageMailState.MAILED, ChatMessageMailState.MUTED])),
})

// A member of the calling community changed a message they wrote to a member of this one (E-060).
export const editChatMessageWireSchema = v.object({
  writer: chatMemberSchema,
  messageUuid: uuidv4Schema,
  body: chatMessageBodySchema,
})
export type EditChatMessageWire = v.InferOutput<typeof editChatMessageWireSchema>
