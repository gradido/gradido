import { gql } from 'graphql-request'

export const authenticate = gql`
  mutation ($args: AuthenticationArgs!) {
    authenticate(data: $args)
  }
`
