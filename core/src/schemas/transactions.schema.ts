import { decaySchema, GradidoUnit } from 'shared'
import * as v from 'valibot'

const nonNegativeIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(0))
const integerSchema = v.pipe(v.number(), v.integer())
// whatever `new Date()` makes a date of: a Date, a timestamp, a date string
const coercedDateSchema = v.pipe(
  v.unknown(),
  v.transform((value) => new Date(value as string | number | Date)),
  v.date(),
)
const maxLength512Schema = v.pipe(v.string(), v.maxLength(512))
const uuidSchema = v.pipe(v.string(), v.uuid())

// can be later created automatically from drizzle database schema
export const dbTransactionsSchema = v.object({
  id: nonNegativeIntegerSchema,
  previous: v.nullable(nonNegativeIntegerSchema),
  typeId: nonNegativeIntegerSchema,
  transactionLinkId: v.nullish(nonNegativeIntegerSchema),
  amount: v.instance(GradidoUnit),
  balance: v.instance(GradidoUnit),
  decay: v.instance(GradidoUnit),
  balanceDate: coercedDateSchema,
  decayStart: v.nullable(coercedDateSchema),
  decayCalculationType: v.optional(nonNegativeIntegerSchema, 0),
  memo: maxLength512Schema,
  creationDate: v.nullable(coercedDateSchema),
  userId: nonNegativeIntegerSchema,
  userCommunityUuid: v.nullable(uuidSchema),
  userGradidoID: uuidSchema,
  userName: v.nullable(maxLength512Schema),
  linkedUserId: v.nullish(nonNegativeIntegerSchema),
  linkedUserCommunityUuid: v.nullable(uuidSchema),
  linkedUserGradidoID: v.nullable(uuidSchema),
  linkedUserName: v.nullable(maxLength512Schema),
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
  balanceDate: coercedDateSchema,
  decay: decaySchema,
  memo: v.string(),
  creationDate: v.nullable(coercedDateSchema),
  linkedTransactionId: v.nullable(integerSchema),
  linkId: v.nullable(integerSchema),
  // optional: `any` takes a key that is left out as well
  user: v.optional(v.any()), // use user schema when defined
  linkedUser: v.optional(v.nullable(v.any())),
})

export type Transaction = v.InferOutput<typeof transactionsSchema>
