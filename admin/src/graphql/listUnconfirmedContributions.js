import gql from 'graphql-tag'

export const listUnconfirmedContributions = gql`
  query {
    listUnconfirmedContributions {
      id
      firstName
      lastName
      userId
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
