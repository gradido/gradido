import gql from 'graphql-tag'

export const deletePendingCreation = gql`
  mutation ($id: Float!) {
    deletePendingCreation(id: $id)
  }
`
