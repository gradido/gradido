import Decimal from 'decimal.js-light'
import { GradidoUnit, InMemoryBlockchain, KeyPairEd25519 } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { booleanSchema, dateSchema } from '../../schemas/typeConverter.schema'
import {
  gradidoAmountSchema,
  identifierSeedSchema,
  memoSchema,
  uuidv4Schema,
} from '../../schemas/typeGuard.schema'
import { Balance } from './data/Balance'
import { TransactionTypeId } from './data/TransactionTypeId'

const positiveNumberSchema = v.pipe(v.number(), v.minValue(1))

export const userDbSchema = v.object({
  id: positiveNumberSchema,
  gradidoId: uuidv4Schema,
  communityUuid: uuidv4Schema,
  createdAt: dateSchema,
})
/*
declare const validLegacyAmount: unique symbol
export type LegacyAmount = string & { [validLegacyAmount]: true }

export const legacyAmountSchema = v.pipe(
  v.string(),
  v.regex(/^-?[0-9]+(\.[0-9]+)?$/),
  v.transform<string, LegacyAmount>((input: string) => input as LegacyAmount),
)

declare const validGradidoAmount: unique symbol
export type GradidoAmount = GradidoUnit & { [validGradidoAmount]: true }

export const gradidoAmountSchema = v.pipe(
  v.union([legacyAmountSchema, v.instance(GradidoUnit, 'expect GradidoUnit type')]),
  v.transform<LegacyAmount | GradidoUnit, GradidoAmount>((input: LegacyAmount | GradidoUnit) => {
    if (input instanceof GradidoUnit) {
      return input as GradidoAmount
    }
    // round floor with decimal js beforehand
    const rounded = new Decimal(input).toDecimalPlaces(4, Decimal.ROUND_FLOOR).toString()
    return GradidoUnit.fromString(rounded) as GradidoAmount
  }),
)
*/
export const transactionBaseSchema = v.object({
  id: positiveNumberSchema,
  amount: gradidoAmountSchema,
  memo: memoSchema,
  user: userDbSchema,
})

export const transactionDbSchema = v.pipe(
  v.object({
    ...transactionBaseSchema.entries,
    typeId: v.enum(TransactionTypeId),
    balanceDate: dateSchema,
    linkedUser: userDbSchema,
  }),
  v.custom((value: any) => {
    if (
      value.user &&
      value.linkedUser &&
      !value.transactionLinkCode &&
      value.user.gradidoId === value.linkedUser.gradidoId
    ) {
      throw new Error(
        `expect user to be different from linkedUser: ${JSON.stringify(value, null, 2)}`,
      )
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
  }),
)

export const creationTransactionDbSchema = v.pipe(
  v.object({
    ...transactionBaseSchema.entries,
    contributionDate: dateSchema,
    confirmedAt: dateSchema,
    confirmedByUser: userDbSchema,
    transactionId: positiveNumberSchema,
  }),
  v.custom((value: any) => {
    if (
      value.user &&
      value.confirmedByUser &&
      value.user.gradidoId === value.confirmedByUser.gradidoId
    ) {
      throw new Error(
        `expect user to be different from confirmedByUser: ${JSON.stringify(value, null, 2)}`,
      )
    }
    // check that user and confirmedByUser exist before transaction balance date
    const confirmedAt = new Date(value.confirmedAt)
    if (
      value.user.createdAt.getTime() >= confirmedAt.getTime() ||
      value.confirmedByUser?.createdAt.getTime() >= confirmedAt.getTime()
    ) {
      throw new Error(
        `at least one user was created after transaction confirmedAt date, logic error! ${JSON.stringify(value, null, 2)}`,
      )
    }

    return value
  }),
)

export const transactionLinkDbSchema = v.object({
  ...transactionBaseSchema.entries,
  code: identifierSeedSchema,
  createdAt: dateSchema,
  validUntil: dateSchema,
  holdAvailableAmount: gradidoAmountSchema,
  redeemedAt: v.nullish(dateSchema),
  deletedAt: v.nullish(dateSchema),
})

export const redeemedTransactionLinkDbSchema = v.object({
  ...transactionLinkDbSchema.entries,
  redeemedAt: dateSchema,
  redeemedBy: userDbSchema,
})

export const deletedTransactionLinKDbSchema = v.object({
  id: positiveNumberSchema,
  user: userDbSchema,
  code: identifierSeedSchema,
  deletedAt: dateSchema,
})

export const communityDbSchema = v.object({
  id: positiveNumberSchema,
  foreign: booleanSchema,
  communityUuid: uuidv4Schema,
  name: v.string(),
  creationDate: dateSchema,
  userMinCreatedAt: v.nullish(dateSchema),
})

export const communityContextSchema = v.object({
  communityId: v.string(),
  foreign: booleanSchema,
  blockchain: v.instance(InMemoryBlockchain, 'expect InMemoryBlockchain type'),
  keyPair: v.instance(KeyPairEd25519),
  folder: v.pipe(
    v.string(),
    v.minLength(1, 'expect string length >= 1'),
    v.maxLength(512, 'expect string length <= 512'),
    v.regex(/^[a-zA-Z0-9-_]+$/, 'expect string to be a valid (alphanumeric, _, -) folder name'),
  ),
  gmwBalance: v.instance(Balance),
  aufBalance: v.instance(Balance),
})

export type TransactionDb = v.InferOutput<typeof transactionDbSchema>
export type CreationTransactionDb = v.InferOutput<typeof creationTransactionDbSchema>
export type UserDb = v.InferOutput<typeof userDbSchema>
export type TransactionLinkDb = v.InferOutput<typeof transactionLinkDbSchema>
export type RedeemedTransactionLinkDb = v.InferOutput<typeof redeemedTransactionLinkDbSchema>
export type DeletedTransactionLinkDb = v.InferOutput<typeof deletedTransactionLinKDbSchema>
export type CommunityDb = v.InferOutput<typeof communityDbSchema>
export type CommunityContext = v.InferOutput<typeof communityContextSchema>
