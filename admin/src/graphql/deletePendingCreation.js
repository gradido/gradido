import gql from 'graphql-tag'

export const deletePendingCreation = gql`
  mutation ($id: Int!) {
    deletePendingCreation(id: $id)
  }
`
