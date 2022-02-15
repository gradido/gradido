import gql from 'graphql-tag'

export const searchUsers = gql`
  query ($searchText: String!, $currentPage: Int, $pageSize: Int, $notActivated: Boolean) {
    searchUsers(
      searchText: $searchText
      currentPage: $currentPage
      pageSize: $pageSize
      notActivated: $notActivated
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
      }
    }
  }
`
