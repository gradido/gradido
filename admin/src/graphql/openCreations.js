import gql from 'graphql-tag'

export const openCreations = gql`
  query ($userId: Int) {
    openCreations(userId: $userId) {
      year
      month
      amount
    }
  }
`
