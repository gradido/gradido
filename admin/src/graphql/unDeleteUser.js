import gql from 'graphql-tag'

export const unDeleteUser = gql`
  mutation ($userId: Float!) {
    unDeleteUser(userId: $userId)
  }
`
