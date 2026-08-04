import gql from 'graphql-tag'

export const verifyLogin = gql`
  query {
    verifyLogin {
      firstName
      lastName
      roles
      id
      language
      visibleGroupTags
      seesAllGroups
      seesUntagged
    }
  }
`
