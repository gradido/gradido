import gql from 'graphql-tag'

export const confirmContribution = gql`
  mutation ($id: Int!) {
    confirmContribution(id: $id)
  }
`
