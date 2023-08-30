import { gql } from 'graphql-request'

export const revertSettledSendCoins = gql`
  mutation (
    $communityReceiverIdentifier: String!
    $userReceiverIdentifier: String!
    $creationDate: Date!
    $amount: Decimal!
    $memo: String!
    $communitySenderIdentifier: String!
    $userSenderIdentifier: String!
    $userSenderName: String!
  ) {
    revertSettledSendCoins(
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
