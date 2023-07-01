import gql from 'graphql-tag'

export const adminListContributions = gql`
  query (
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $statusFilter: [ContributionStatus!]
    $userId: Int
    $query: String
  ) {
    adminListContributions(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      statusFilter: $statusFilter
      userId: $userId
      query: $query
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
        status
        messagesCount
        deniedAt
        deniedBy
        deletedAt
        deletedBy
        moderatorId
        userId
      }
    }
  }
`
