import gql from 'graphql-tag'

export const verifyLogin = gql`
  query {
    verifyLogin {
      firstName
      lastName
      alias
      role
      gradidoID
      communityUuid
      language
      avatar
      avatarColorIndex
      visibleCreationGroups
      seesAllCreationGroups
      seesUntagged
    }
  }
`
