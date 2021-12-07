import gql from 'graphql-tag'

export const updatePendingCreation = gql`
  mutation (
    $id: Int!
    $email: String!
    $amount: Int!
    $memo: String!
    $creationDate: String!
    $moderator: Int!
  ) {
    updatePendingCreation(
      id: $id
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
      moderator: $moderator
    ) {
      amount
      date
      memo
      creation
      moderator
    }
  }
`
