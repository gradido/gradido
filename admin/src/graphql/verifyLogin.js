import gql from 'graphql-tag'

export const verifyLogin = gql`
  query {
    verifyLogin {
      firstName
      lastName
      alias
      role
      id
      language
      visibleCreationGroups
      seesAllCreationGroups
      seesUntagged
    }
  }
`
