import {
  dateSchema,
  decaySchema,
  GradidoUnit,
  integerSchema,
  MEMO_MAX_CHARS,
  nonNegativeIntegerSchema,
  uuidv4Schema,
} from 'shared'
import * as v from 'valibot'

const memoSchema = v.pipe(v.string(), v.maxLength(MEMO_MAX_CHARS))
// 512 because of old datas
const combinedFirstNameLastNameSchema = v.pipe(v.string(), v.maxLength(512))

// can be later created automatically from drizzle database schema
export const dbTransactionsSchema = v.object({
  id: nonNegativeIntegerSchema,
  previous: v.nullable(nonNegativeIntegerSchema),
  typeId: nonNegativeIntegerSchema,
  transactionLinkId: v.nullish(nonNegativeIntegerSchema),
  amount: v.instance(GradidoUnit),
  balance: v.instance(GradidoUnit),
  decay: v.instance(GradidoUnit),
  balanceDate: dateSchema,
  decayStart: v.nullable(dateSchema),
  decayCalculationType: v.optional(nonNegativeIntegerSchema, 0),
  memo: memoSchema,
  creationDate: v.nullable(dateSchema),
  userId: nonNegativeIntegerSchema,
  userCommunityUuid: v.nullable(uuidv4Schema),
  userGradidoID: uuidv4Schema,
  userName: v.nullable(combinedFirstNameLastNameSchema),
  linkedUserId: v.nullish(nonNegativeIntegerSchema),
  linkedUserCommunityUuid: v.nullable(uuidv4Schema),
  linkedUserGradidoID: v.nullable(uuidv4Schema),
  linkedUserName: v.nullable(combinedFirstNameLastNameSchema),
  linkedTransactionId: v.nullish(nonNegativeIntegerSchema),
})

export type dbTransaction = v.InferOutput<typeof dbTransactionsSchema>

export const transactionsSchema = v.object({
  id: integerSchema,
  previous: v.nullable(integerSchema),
  typeId: integerSchema,
  amount: v.instance(GradidoUnit),
  balance: v.instance(GradidoUnit),
  previousBalance: v.instance(GradidoUnit),
  balanceDate: dateSchema,
  decay: decaySchema,
  memo: v.string(),
  creationDate: v.nullable(dateSchema),
  linkedTransactionId: v.nullable(integerSchema),
  linkId: v.nullable(integerSchema),
  // optional: `any` takes a key that is left out as well
  user: v.optional(v.any()), // use user schema when defined
  linkedUser: v.optional(v.nullable(v.any())),
})

export type Transaction = v.InferOutput<typeof transactionsSchema>
