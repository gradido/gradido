import gql from 'graphql-tag'

export const searchUsers = gql`
  query ($searchText: String!, $currentPage: Int, $notActivated: Boolean) {
    searchUsers(searchText: $searchText, currentPage: $currentPage, notActivated: $notActivated) {
      userCount
      userList {
        userId
        firstName
        lastName
        email
        creation
        emailChecked
      }
    }
  }
`
