import { z } from 'zod'
import { uuidv4Schema } from './base.schema'

export const communityAuthenticatedSchema = z.object({
  communityUuid: uuidv4Schema,
  authenticatedAt: z.date(),
})
