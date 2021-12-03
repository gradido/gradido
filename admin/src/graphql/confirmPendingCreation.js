import gql from 'graphql-tag'

export const confirmPendingCreation = gql`
  mutation ($id: Float!) {
    confirmPendingCreation(id: $id)
  }
`
