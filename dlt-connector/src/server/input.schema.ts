import { TypeBoxFromValibot } from '@sinclair/typemap'
import { t } from 'elysia'
import { hieroIdSchema, uuidv4Schema } from '../schemas/typeGuard.schema'

export const accountIdentifierUserTypeBoxSchema = t.Object({
  communityId: TypeBoxFromValibot(uuidv4Schema),
  communityTopicId: TypeBoxFromValibot(hieroIdSchema),
  userUuid: TypeBoxFromValibot(uuidv4Schema),
  accountNr: t.Number({ min: 0 }),
})

// identifier for a gradido account created by transaction link / deferred transfer
export const accountIdentifierSeedTypeBoxSchema = t.Object({
  communityId: TypeBoxFromValibot(uuidv4Schema),
  communityTopicId: TypeBoxFromValibot(hieroIdSchema),
  seed: TypeBoxFromValibot(uuidv4Schema),
})
