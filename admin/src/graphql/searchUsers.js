import gql from 'graphql-tag'

export const searchUsers = gql`
  query (
    $searchText: String!
    $currentPage: Int
    $pageSize: Int
    $emailChecked: Boolean
    $deletedAt: Boolean
  ) {
    searchUsers(
      searchText: $searchText
      currentPage: $currentPage
      pageSize: $pageSize
      emailChecked: $emailChecked
      deletedAt: $deletedAt
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
