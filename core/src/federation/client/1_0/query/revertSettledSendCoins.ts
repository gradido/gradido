import { gql } from 'graphql-request'

export const revertSettledSendCoins = gql`
  mutation ($args: EncryptedTransferArgs!) {
    revertSettledSendCoins(data: $args)
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
    revertSettledSendCoins(
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
