import gql from 'graphql-tag'

export const updatePendingCreation = gql`
  query ($email: String!, $amount: Int!, $memo: String!, $creationDate: String!, $moderator: Int!) {
    updatePendingCreation(
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
      moderator: $moderator
    )
  }
`
