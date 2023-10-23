import { gql } from 'graphql-request'

export const authenticate = gql`
  mutation ($args: AuthenticateArgs!) {
    authenticate(data: $args) {
      uuid
    }
  }
`
