import gql from 'graphql-tag'

export const createPendingCreation = gql`
  mutation ($id: Int!) {
    confirmPendingCreation(id: $id)
  }
`
