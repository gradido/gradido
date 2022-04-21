import gql from 'graphql-tag'

export const searchUsers = gql`
  query (
    $searchText: String!
    $currentPage: Int
    $pageSize: Int
    $withActivated: Boolean
    $withDeleted: Boolean
  ) {
    searchUsers(
      searchText: $searchText
      currentPage: $currentPage
      pageSize: $pageSize
      withActivated: $withActivated
      withDeleted: $withDeleted
    ) {
      userCount
      userList {
        userId
        firstName
        lastName
        email
        creation
        hasElopage
        emailConfirmationSend
        withActivated
        withDeleted
      }
    }
  }
`
