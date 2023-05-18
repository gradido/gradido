import { gql } from 'graphql-request'

export const getPublicKey = gql`
  query {
    getPublicKey
  }
`
