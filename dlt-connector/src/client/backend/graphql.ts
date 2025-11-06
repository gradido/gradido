import { gql } from 'graphql-request'

/**
 * Schema Definitions for graphql requests
 */

// graphql query for getting home community in tune with community schema
export const homeCommunityGraphqlQuery = gql`
  query {
    homeCommunity {
      uuid
      name
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
      name
      hieroTopicId
      foreign
      creationDate
    }
  }
`
