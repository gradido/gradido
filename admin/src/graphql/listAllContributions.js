import gql from 'graphql-tag'

export const listAllContributions = gql`
  query ($currentPage: Int = 1, $pageSize: Int = 25, $order: Order = DESC) {
    listAllContributions(currentPage: $currentPage, pageSize: $pageSize, order: $order) {
      contributionCount
      contributionList {
        id
        firstName
        lastName
        amount
        memo
        createdAt
        contributionDate
        confirmedAt
        confirmedBy
        state
        messagesCount
        deniedAt
        deniedBy
      }
    }
  }
`
