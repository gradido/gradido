import { gql } from 'graphql-request'

export const revertSendCoins = gql`
  mutation ($args: EncryptedTransferArgs!) {
    revertSendCoins(data: $args)
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
    revertSendCoins(
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
