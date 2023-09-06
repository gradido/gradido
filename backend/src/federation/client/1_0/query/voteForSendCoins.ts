import { gql } from 'graphql-request'

export const voteForSendCoins = gql`
  mutation (
    $communityReceiverIdentifier: String!
    $userReceiverIdentifier: String!
    $creationDate: String!
    $amount: Decimal!
    $memo: String!
    $communitySenderIdentifier: String!
    $userSenderIdentifier: String!
    $userSenderName: String!
  ) {
    voteForSendCoins(
      communityReceiverIdentifier: $communityReceiverIdentifier
      userReceiverIdentifier: $userReceiverIdentifier
      creationDate: $creationDate
      amount: $amount
      memo: $memo
      communitySenderIdentifier: $communitySenderIdentifier
      userSenderIdentifier: $userSenderIdentifier
      userSenderName: $userSenderName
    )
  }
`
