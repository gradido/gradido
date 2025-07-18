import * as v from 'valibot'
import { uuidv4Schema } from './typeGuard.schema'
import { dateSchema } from './typeConverter.schema'

/**
 * Schema Definitions for rpc call parameter, when dlt-connector is called from backend
 */

/**
 * Schema for community, for creating new CommunityRoot Transaction on gradido blockchain
 */
export const communitySchema = v.object({
  uuid: uuidv4Schema,
  foreign: v.boolean('expect boolean type'),
  createdAt: dateSchema,
})

export type CommunityInput = v.InferInput<typeof communitySchema>
export type Community = v.InferOutput<typeof communitySchema>
