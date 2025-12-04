import * as v from 'valibot'
import { hieroIdSchema, identifierSeedSchema, uuidv4Schema } from './typeGuard.schema'

// identifier for gradido community accounts, inside a community
export const identifierCommunityAccountSchema = v.object({
  userUuid: uuidv4Schema,
  accountNr: v.optional(v.number('expect number type'), 0),
})

export type IdentifierCommunityAccount = v.InferOutput<typeof identifierCommunityAccountSchema>

export const identifierKeyPairSchema = v.object({
  communityTopicId: hieroIdSchema,
  account: v.optional(identifierCommunityAccountSchema),
  seed: v.optional(identifierSeedSchema),
})
export type IdentifierKeyPairInput = v.InferInput<typeof identifierKeyPairSchema>
export type IdentifierKeyPair = v.InferOutput<typeof identifierKeyPairSchema>

// identifier for gradido account, including the community uuid
export const identifierAccountSchema = v.pipe(
  identifierKeyPairSchema,
  v.custom((value: any) => {
    const setFieldsCount = Number(value.seed !== undefined) + Number(value.account !== undefined)
    if (setFieldsCount !== 1) {
      return false
    }
    return true
  }, 'expect seed or account'),
)

export type IdentifierAccountInput = v.InferInput<typeof identifierAccountSchema>
export type IdentifierAccount = v.InferOutput<typeof identifierAccountSchema>
