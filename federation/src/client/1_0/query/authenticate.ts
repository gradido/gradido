import { gql } from 'graphql-request'

export const authenticate = gql`
  mutation ($args: EncryptedTransferArgs!) {
    authenticate(data: $args)
  }
`
