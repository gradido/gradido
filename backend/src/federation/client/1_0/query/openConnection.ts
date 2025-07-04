import { gql } from 'graphql-request'

export const openConnection = gql`
  mutation ($args: EncryptedTransferArgs!) {
    openConnection(data: $args)
  }
`
