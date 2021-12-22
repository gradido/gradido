import gql from 'graphql-tag'

export const searchUsers = gql`
  query ($searchText: String!) {
    searchUsers(searchText: $searchText) {
      userId
      firstName
      lastName
      email
      creation
      emailChecked
    }
  }
`
