import gql from 'graphql-tag'

export const getPendingCreations = gql`
  query {
    getPendingCreations {
      id
      firstName
      lastName
      email
      amount
      note
      date
      moderator
      creation
    }
  }
`
