import { gql } from 'graphql-request'

export const revertSendCoins = gql`
  mutation (
    $communityReceiverIdentifier: String!
    $userReceiverIdentifier: String!
    $amount: Decimal!
    $memo: String!
    $communitySenderIdentifier: String!
    $userSenderIdentifier: String!
    $userSenderName: String!
  ) {
    revertSendCoins(
      communityReceiverIdentifier: $communityReceiverIdentifier
      userReceiverIdentifier: $userReceiverIdentifier
      amount: $amount
      memo: $memo
      communitySenderIdentifier: $communitySenderIdentifier
      userSenderIdentifier: $userSenderIdentifier
      userSenderName: $userSenderName
    ) {
      acknowledged
    }
  }
`
