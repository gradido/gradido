import { TypeBoxFromValibot } from '@sinclair/typemap'
import { t } from 'elysia'
import { hieroIdSchema, uuidv4Schema } from '../schemas/typeGuard.schema'

export const accountIdentifierUserSchema = t.Object({
  communityTopicId: TypeBoxFromValibot(hieroIdSchema),
  userUuid: TypeBoxFromValibot(uuidv4Schema),
  accountNr: t.Number().positive(),
})

// identifier for a gradido account created by transaction link / deferred transfer
export const accountIdentifierSeedSchema = t.Object({
  communityTopicId: TypeBoxFromValibot(hieroIdSchema),
  seed: TypeBoxFromValibot(uuidv4Schema),
})

export const existSchema = t.Object({
  exists: t.Boolean(),
})
