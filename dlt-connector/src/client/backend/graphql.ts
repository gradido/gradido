import { gql } from 'graphql-request'

/**
 * Schema Definitions for graphql requests
 */

const communityFragment = gql`
  fragment Community_common on Community {
    uuid
    name
    hieroTopicId
    foreign
    creationDate
  }
`

// graphql query for getting home community in tune with community schema
export const homeCommunityGraphqlQuery = gql`
  query {
    homeCommunity {
      ...Community_common
    }
  }
  ${communityFragment}
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

export const getReachableCommunities = gql`
  query {
    reachableCommunities {
    ...Community_common
    }
  }
  ${communityFragment}
`
