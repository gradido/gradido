import gql from 'graphql-tag'

export const searchUsers = gql`
  query (
    $searchText: String!
    $currentPage: Int
    $pageSize: Int
    $filterByActivated: Boolean
    $filterByDeleted: Boolean
  ) {
    searchUsers(
      searchText: $searchText
      currentPage: $currentPage
      pageSize: $pageSize
      filterByActivated: $filterByActivated # Wolle: put in 'filters' object?
      filterByDeleted: $filterByDeleted
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
      }
    }
  }
`
