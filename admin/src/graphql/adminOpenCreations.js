import gql from 'graphql-tag'

export const adminOpenCreations = gql`
  query ($userId: Int!) {
    adminOpenCreations(userId: $userId) {
      year
      month
      amount
    }
  }
`
