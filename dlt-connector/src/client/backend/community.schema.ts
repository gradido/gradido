import { gql } from 'graphql-request'
import * as v from 'valibot'
import { dateSchema } from '../../schemas/typeConverter.schema'
import { hieroIdSchema, uuidv4Schema } from '../../schemas/typeGuard.schema'

/**
 * Schema Definitions for rpc call parameter, when dlt-connector is called from backend
 */

/**
 * Schema for community, for creating new CommunityRoot Transaction on gradido blockchain
 */
export const communitySchema = v.object({
  uuid: uuidv4Schema,
  topicId: hieroIdSchema,
  foreign: v.boolean('expect boolean type'),
  createdAt: dateSchema,
})

export type CommunityInput = v.InferInput<typeof communitySchema>
export type Community = v.InferOutput<typeof communitySchema>

// graphql query for getting home community in tune with community schema
export const homeCommunityGraphqlQuery = gql`
  query {
    homeCommunity {
      uuid
      topicId
      foreign
      creationDate
    }
  }
`
