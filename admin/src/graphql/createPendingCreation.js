import gql from 'graphql-tag'

export const createPendingCreation = gql`
  query ($email: String!, $amount: Int!, $note: String!, $creationDate: String!, $moderator: Int!) {
    createPendingCreation(
      email: $email
      amount: $amount
      note: $note
      creationDate: $creationDate
      moderator: $moderator
    )
  }
`
