// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

export const allCommunities = gql`
  query ($currentPage: Int!, $pageSize: Int!) {
    allCommunities(currentPage: $currentPage, pageSize: $pageSize) {
      count
      communities {
        foreign
        url
        publicKey
        uuid
        authenticatedAt
        verifiedAt
        name
        description
        gmsApiKey
        location
        creationDate
        createdAt
        updatedAt
        hieroTopicId
      }
    }
  }
`
