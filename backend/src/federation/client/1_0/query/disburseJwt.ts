import { gql } from 'graphql-request'

export const disburseJwt = gql`
  mutation ($arg: String!) {
    disburseJwt(jwt: $arg) {
      accepted
      acceptedAt
      transactionId
      message
    }
  }
`
