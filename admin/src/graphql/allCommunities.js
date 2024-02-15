import gql from 'graphql-tag'

export const allCommunities = gql`
  query {
    allCommunities {
      foreign
      url
      publicKey
      communityUuid
      authenticatedAt
      name
      description
      gmsApiKey
      creationDate
      createdAt
      updatedAt
      federatedCommunities {
        id
        apiVersion
        endPoint
        lastAnnouncedAt
        verifiedAt
        lastErrorAt
        createdAt
        updatedAt
      }
    }
  }
`
