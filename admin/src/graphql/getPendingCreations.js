import gql from 'graphql-tag'

export const getPendingCreations = gql`
  query {
    getPendingCreations {
      id
      firstName
      lastName
      email
      amount
      memo
      date
      moderator
      creation
    }
  }
`
