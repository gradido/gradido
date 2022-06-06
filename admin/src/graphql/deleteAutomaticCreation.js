import gql from 'graphql-tag'

export const deleteAutomaticCreation = gql`
  mutation ($id: Int!) {
    deleteAutomaticCreation(id: $id)
  }
`
