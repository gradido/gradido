import gql from 'graphql-tag'

export const searchUsers = gql`
  query (
    $query: String!
    $filters: SearchUsersFilters
    $currentPage: Int = 0
    $pageSize: Int = 25
    $order: Order = ASC
  ) {
    searchUsers(
      query: $query
      filters: $filters
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
    ) {
      userCount
      userList {
        userId
        firstName
        lastName
        email
        creation
        emailChecked
        hasElopage
        emailConfirmationSend
        deletedAt
        createdAt
        roles
      }
    }
  }
`
