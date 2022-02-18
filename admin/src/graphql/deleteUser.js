import gql from 'graphql-tag'

export const deleteUser = gql`
  mutation ($userId: Float!) {
    deleteUser(userId: $userId)
  }
`
