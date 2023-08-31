import { gql } from 'graphql-request'

export const getPublicCommunityInfo = gql`
  query {
    getPublicCommunityInfo {
      name
      description
      creationDate
      publicKey
    }
  }
`
