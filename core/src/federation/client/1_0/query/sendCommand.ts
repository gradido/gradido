import { gql } from 'graphql-request'

export const sendCommand = gql`
  mutation ($args: EncryptedTransferArgs!) {
    sendCommand(encryptedArgs: $args) {
      success
      data
      error
    }
  }
`
