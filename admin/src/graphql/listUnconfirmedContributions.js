import gql from 'graphql-tag'

export const listUnconfirmedContributions = gql`
  query {
    listUnconfirmedContributions {
      id
      firstName
      lastName
      email
      amount
      memo
      date
      moderator
      creation
      state
      messageCount
    }
  }
`
