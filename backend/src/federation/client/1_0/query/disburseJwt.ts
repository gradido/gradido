import { gql } from 'graphql-request'

export const disburseJwt = gql`
  mutation ($jwt: String!) {
    disburseJwt(jwt: $jwt) {
      accepted
      acceptedAt
      transactionId
      message
    }
  }
`
