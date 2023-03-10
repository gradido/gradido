import gql from 'graphql-tag'

export const openCreations = gql`
  query ($userId: Int) {
    openCreations(userId: $userID) {
      year
      month
      amount
    }
  }
`
