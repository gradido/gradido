import gql from 'graphql-tag'

export const searchUsers = gql`
  query (
    $searchText: String!
    $currentPage: Int
    $pageSize: Int
    $notActivated: Boolean
    $isDeleted: Boolean
  ) {
    searchUsers(
      searchText: $searchText
      currentPage: $currentPage
      pageSize: $pageSize
      notActivated: $notActivated
      isDeleted: $isDeleted
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
