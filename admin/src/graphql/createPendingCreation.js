import gql from 'graphql-tag'

export const createPendingCreation = gql`
  mutation (
    $email: String!
    $amount: Float!
    $memo: String!
    $creationDate: String!
    $moderator: Int!
  ) {
    createPendingCreation(
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
      moderator: $moderator
    )
  }
`
