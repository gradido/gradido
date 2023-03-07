import gql from 'graphql-tag'

export const adminListContributions = gql`
  query (
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $statusFilter: [ContributionStatus!]
    $userId: Int
  ) {
    adminListContributions(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      statusFilter: $statusFilter
      userId: $userId
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
        deletedAt
        deletedBy
      }
    }
  }
`
