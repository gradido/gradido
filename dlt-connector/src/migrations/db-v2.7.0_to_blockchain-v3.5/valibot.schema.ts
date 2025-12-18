import { InMemoryBlockchain } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { booleanSchema, dateSchema } from '../../schemas/typeConverter.schema'
import {
  gradidoAmountSchema,
  hieroIdSchema,
  identifierSeedSchema,
  memoSchema,
  uuidv4Schema,
} from '../../schemas/typeGuard.schema'
import { TransactionTypeId } from './TransactionTypeId'

export const createdUserDbSchema = v.object({
  id: v.pipe(v.number(), v.minValue(1)),
  gradidoId: uuidv4Schema,
  communityUuid: uuidv4Schema,
  createdAt: dateSchema,
})

export const userDbSchema = v.object({
  gradidoId: uuidv4Schema,
  communityUuid: uuidv4Schema,
})

export const transactionDbSchema = v.pipe(v.object({
  id: v.pipe(v.number(), v.minValue(1)),
  typeId: v.enum(TransactionTypeId),
  amount: gradidoAmountSchema,
  balanceDate: dateSchema,
  balance: gradidoAmountSchema,
  linkedUserBalance: gradidoAmountSchema,
  memo: memoSchema,
  creationDate: v.nullish(dateSchema),
  user: createdUserDbSchema,
  linkedUser: createdUserDbSchema,
  transactionLinkCode: v.nullish(identifierSeedSchema),
}), v.custom((value: any) => {
  if (value.user && value.linkedUser && !value.transactionLinkCode && value.user.gradidoId === value.linkedUser.gradidoId) {
    throw new Error(`expect user to be different from linkedUser: ${JSON.stringify(value, null, 2)}`)
  }
  // check that user and linked user exist before transaction balance date
  const balanceDate = new Date(value.balanceDate)
  if (
    value.user.createdAt.getTime() >= balanceDate.getTime() ||
    value.linkedUser?.createdAt.getTime() >= balanceDate.getTime()
  ) {
    throw new Error(
      `at least one user was created after transaction balance date, logic error! ${JSON.stringify(value, null, 2)}`,
    )
  }
  
  return value
}))

export const transactionLinkDbSchema = v.object({
  id: v.pipe(v.number(), v.minValue(1)),
  user: userDbSchema,
  code: identifierSeedSchema,
  amount: gradidoAmountSchema,
  memo: memoSchema,
  createdAt: dateSchema,
  validUntil: dateSchema,
})

export const communityDbSchema = v.object({
  foreign: booleanSchema,
  communityUuid: uuidv4Schema,
  name: v.string(),
  creationDate: dateSchema,
  userMinCreatedAt: v.nullish(dateSchema),
  uniqueAlias: v.string(),
})

export const communityContextSchema = v.object({
  communityId: v.string(),
  blockchain: v.instance(InMemoryBlockchain, 'expect InMemoryBlockchain type'),
  topicId: hieroIdSchema,
  folder: v.pipe(
    v.string(),
    v.minLength(1, 'expect string length >= 1'),
    v.maxLength(512, 'expect string length <= 512'),
    v.regex(/^[a-zA-Z0-9-_]+$/, 'expect string to be a valid (alphanumeric, _, -) folder name'),
  ),
})

export type TransactionDb = v.InferOutput<typeof transactionDbSchema>
export type UserDb = v.InferOutput<typeof userDbSchema>
export type CreatedUserDb = v.InferOutput<typeof createdUserDbSchema>
export type TransactionLinkDb = v.InferOutput<typeof transactionLinkDbSchema>
export type CommunityDb = v.InferOutput<typeof communityDbSchema>
export type CommunityContext = v.InferOutput<typeof communityContextSchema>
