import { gql } from 'graphql-request'
import * as v from 'valibot'
import { dateSchema } from '../../schemas/typeConverter.schema'
import { hieroIdSchema, uuidv4Schema } from '../../schemas/typeGuard.schema'

/**
 * Schema Definitions for graphql response
 */
export const communitySchema = v.object({
  uuid: uuidv4Schema,
  hieroTopicId: v.nullish(hieroIdSchema),
  foreign: v.boolean('expect boolean type'),
  creationDate: dateSchema,
})

export type CommunityInput = v.InferInput<typeof communitySchema>
export type Community = v.InferOutput<typeof communitySchema>

// graphql query for getting home community in tune with community schema
export const homeCommunityGraphqlQuery = gql`
  query {
    homeCommunity {
      uuid
      hieroTopicId
      foreign
      creationDate
    }
  }
`

export const setHomeCommunityTopicId = gql`
  mutation ($uuid: String!, $hieroTopicId: String){
    updateHomeCommunity(uuid: $uuid, hieroTopicId: $hieroTopicId) {
      uuid
      hieroTopicId
      foreign
      creationDate
    }
  }
`
