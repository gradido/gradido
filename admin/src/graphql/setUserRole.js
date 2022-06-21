import gql from 'graphql-tag'

export const setUserRole = gql`
  mutation ($userId: Int!, $isAdmin: Boolean!) {
    setUserRole(userId: $userId, isAdmin: $isAdmin)
  }
`
