import Decimal from 'decimal.js-light'
import { decaySchema, GradidoUnit } from 'shared'
import { z } from 'zod'

// can be later created automatically from drizzle database schema
export const dbTransactionsSchema = z.object({
  id: z.number().int().nonnegative(),
  previous: z.number().int().nonnegative().nullable(),
  typeId: z.number().int().nonnegative(),
  transactionLinkId: z.number().int().nonnegative().nullable().optional(),
  amount: z.instanceof(Decimal),
  balance: z.instanceof(Decimal),
  decay: z.instanceof(Decimal),
  balanceDate: z.coerce.date(),
  decayStart: z.coerce.date().nullable(),
  decayCalculationType: z.number().int().nonnegative().default(0),
  memo: z.string().max(512),
  creationDate: z.coerce.date().nullable(),
  userId: z.number().int().nonnegative(),
  userCommunityUuid: z.string().uuid().nullable(),
  userGradidoID: z.string().uuid(),
  userName: z.string().max(512).nullable(),
  linkedUserId: z.number().int().nonnegative().nullable().optional(),
  linkedUserCommunityUuid: z.string().uuid().nullable(),
  linkedUserGradidoID: z.string().uuid().nullable(),
  linkedUserName: z.string().max(512).nullable(),
  linkedTransactionId: z.number().int().nonnegative().nullable().optional(),
})

export type dbTransaction = z.infer<typeof dbTransactionsSchema>

export const transactionsSchema = z.object({
  id: z.number().int(),
  previous: z.number().int().nullable(),
  typeId: z.number().int(),
  amount: z.instanceof(GradidoUnit),
  balance: z.instanceof(GradidoUnit),
  previousBalance: z.instanceof(GradidoUnit),
  balanceDate: z.coerce.date(),
  decay: decaySchema,
  memo: z.string(),
  creationDate: z.coerce.date().nullable(),
  linkedTransactionId: z.number().int().nullable(),
  linkId: z.number().int().nullable(),
  user: z.any(), // use user schema when defined
  linkedUser: z.any().nullable(),
})

export type Transaction = z.infer<typeof transactionsSchema>
