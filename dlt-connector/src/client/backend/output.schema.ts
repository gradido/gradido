import * as v from 'valibot'
import { dateSchema } from '../../schemas/typeConverter.schema'
import { hieroIdSchema, uuidv4Schema } from '../../schemas/typeGuard.schema'

export const communitySchema = v.object({
  uuid: uuidv4Schema,
  name: v.string('expect string type'),
  hieroTopicId: v.nullish(hieroIdSchema),
  foreign: v.boolean('expect boolean type'),
  creationDate: dateSchema,
})

export type CommunityInput = v.InferInput<typeof communitySchema>
export type Community = v.InferOutput<typeof communitySchema>
