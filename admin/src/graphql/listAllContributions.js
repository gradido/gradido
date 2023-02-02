import gql from 'graphql-tag'

export const listAllContributions = gql`
  query (
    $currentPage: Int = 1
    $pageSize: Int = 5
    $order: Order = DESC
    $statusFilter: [ContributionStatus!]
  ) {
    listAllContributions(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      statusFilter: $statusFilter
    ) {
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
