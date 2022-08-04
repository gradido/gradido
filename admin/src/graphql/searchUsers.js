import gql from 'graphql-tag'

export const searchUsers = gql`
  query ($searchText: String!, $currentPage: Int, $pageSize: Int, $filters: SearchUsersFilters) {
    searchUsers(
      searchText: $searchText
      currentPage: $currentPage
      pageSize: $pageSize
      filters: $filters
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
        isAdmin
      }
    }
  }
`
