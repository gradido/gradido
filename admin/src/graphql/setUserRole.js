import gql from 'graphql-tag'

export const setUserRole = gql`
  mutation ($userId: Int!, $role: String!) {
    setUserRole(userId: $userId, role: $role)
  }
`
