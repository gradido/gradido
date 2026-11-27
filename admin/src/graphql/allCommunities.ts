// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

export const allCommunities = gql`
  query {
    allCommunities {
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
`
