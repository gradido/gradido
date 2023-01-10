import gql from 'graphql-tag'

export const adminDeleteContribution = gql`
  mutation ($id: Int!) {
    adminDeleteContribution(id: $id)
  }
`
