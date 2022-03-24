import gql from 'graphql-tag'

export const deleteUser = gql`
  mutation ($userId: Int!) {
    deleteUser(userId: $userId)
  }
`
