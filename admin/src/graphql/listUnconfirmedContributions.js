import gql from 'graphql-tag'

export const listUnconfirmedContributions = gql`
  query {
    listUnconfirmedContributions {
      id
      state
    }
  }
`
