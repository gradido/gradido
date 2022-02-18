import gql from 'graphql-tag'

export const unDeleteUser = gql`
  mutation ($userId: Int!) {
    unDeleteUser(userId: $userId)
  }
`
