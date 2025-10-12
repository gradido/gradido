import { object, date } from 'zod'
import { uuidv4Schema } from './base.schema'

export const communityAuthenticatedSchema = object({
  communityUuid: uuidv4Schema,
  authenticatedAt: date(),
})