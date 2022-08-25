import gql from 'graphql-tag'

export const listContributionMessages = gql`
  query (
    $contributionId: Float!
    $pageSize: Int = 25
    $currentPage: Int = 1
    $order: Order = DESC
  ) {
    listContributionMessages(
      contributionId: $contributionId
      pageSize: $pageSize
      currentPage: $currentPage
      order: $order
    ) {
      count
      messages {
        id
        message
        createdAt
        updatedAt
        type
        userFirstName
        userLastName
        userId
      }
    }
  }
`
