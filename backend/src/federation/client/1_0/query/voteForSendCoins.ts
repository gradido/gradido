import { gql } from 'graphql-request'

export const voteForSendCoins = gql`
  mutation ($args: SendCoinsArgs!) {
    voteForSendCoins(data: $args) {
      vote
      recipGradidoID
      recipName
    }
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
    voteForSendCoins(
      data: {
        recipientCommunityUuid: $recipientCommunityUuid
        recipientUserIdentifier: $recipientUserIdentifier
        creationDate: $creationDate
        amount: $amount
        memo: $memo
        senderCommunityUuid: $senderCommunityUuid
        senderUserUuid: $senderUserUuid
        senderUserName: $senderUserName
      }
    ) {
      vote
      recipGradidoID
      recipName
    }
  }
*/
