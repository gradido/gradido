import { gql } from 'graphql-request'

export const settleSendCoins = gql`
  mutation ($args: EncryptedTransferArgs!) {
    settleSendCoins(data: $args)
  }
`
/*
  mutation (
    $recipientCommunityUuid: String!
    $recipientUserIdentifier: String!
    $creationDate: String!
    $amount: Decimal!
    $memo: String!
    $senderCommunityUuid: String!
    $senderUserUuid: String!
    $senderUserName: String!
  ) {
    settleSendCoins(
      recipientCommunityUuid: $recipientCommunityUuid
      recipientUserIdentifier: $recipientUserIdentifier
      creationDate: $creationDate
      amount: $amount
      memo: $memo
      senderCommunityUuid: $senderCommunityUuid
      senderUserUuid: $senderUserUuid
      senderUserName: $senderUserName
    )
  }
*/
