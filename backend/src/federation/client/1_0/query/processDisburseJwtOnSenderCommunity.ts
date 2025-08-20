import { gql } from 'graphql-request'

export const processDisburseJwtOnSenderCommunity = gql`
  mutation ($args: EncryptedTransferArgs!) {
    processDisburseJwtOnSenderCommunity(data: $args)
  }
`
