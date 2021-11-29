import gql from 'graphql-tag'

export const updatePendingCreation = gql`
  query ($email: String!, $amount: Int!, $note: String!, $creationDate: String!, $moderator: Int!) {
    updatePendingCreation(
      email: $email
      amount: $amount
      note: $note
      creationDate: $creationDate
      moderator: $moderator
    )
  }
`
