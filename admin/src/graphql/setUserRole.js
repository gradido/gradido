import gql from 'graphql-tag'

export const setUserRole = gql`
  mutation ($userId: Int!, $role: RoleNames!) {
    setUserRole(userId: $userId, role: $role)
  }
`
