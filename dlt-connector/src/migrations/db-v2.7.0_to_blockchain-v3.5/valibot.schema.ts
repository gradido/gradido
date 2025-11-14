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
  gradidoId: uuidv4Schema,
  communityUuid: uuidv4Schema,
  createdAt: dateSchema,
})

export const userDbSchema = v.object({
  gradidoId: uuidv4Schema,
  communityUuid: uuidv4Schema,
})

export const transactionDbSchema = v.object({
  typeId: v.enum(TransactionTypeId),
  amount: gradidoAmountSchema,
  balanceDate: dateSchema,
  memo: memoSchema,
  creationDate: v.nullish(dateSchema),
  user: userDbSchema,
  linkedUser: userDbSchema,
  transactionLinkCode: v.nullish(identifierSeedSchema),
})

export const transactionLinkDbSchema = v.object({
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
  userMinCreatedAt: dateSchema,
  uniqueAlias: v.string(),
})

export const communityContextSchema = v.object({
  communityId: v.string(),
  blockchain: v.instance(InMemoryBlockchain, 'expect InMemoryBlockchain type'),
  topicId: hieroIdSchema,
  folder: v.pipe(
    v.string(),
    v.minLength(1, 'expect string length >= 1'),
    v.maxLength(255, 'expect string length <= 255'),
    v.regex(/^[a-zA-Z0-9-_]+$/, 'expect string to be a valid (alphanumeric, _, -) folder name'),
  ),
})

export type TransactionDb = v.InferOutput<typeof transactionDbSchema>
export type UserDb = v.InferOutput<typeof userDbSchema>
export type CreatedUserDb = v.InferOutput<typeof createdUserDbSchema>
export type TransactionLinkDb = v.InferOutput<typeof transactionLinkDbSchema>
export type CommunityDb = v.InferOutput<typeof communityDbSchema>
export type CommunityContext = v.InferOutput<typeof communityContextSchema>
