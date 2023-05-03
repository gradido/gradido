import gql from 'graphql-tag'

export const getCommunities = gql`
  query {
    getCommunities {
      id
      foreign
      publicKey
      url
      lastAnnouncedAt
      verifiedAt
      lastErrorAt
      createdAt
      updatedAt
    }
  }
`
