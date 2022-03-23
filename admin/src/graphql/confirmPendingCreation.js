import gql from 'graphql-tag'

export const confirmPendingCreation = gql`
  mutation ($id: Int!) {
    confirmPendingCreation(id: $id)
  }
`
