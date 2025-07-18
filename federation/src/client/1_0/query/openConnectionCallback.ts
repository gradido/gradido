import { gql } from 'graphql-request'

export const openConnectionCallback = gql`
  mutation ($args: EncryptedTransferArgs!) {
    openConnectionCallback(data: $args)
  }
`
