import gql from 'graphql-tag'

export const rejectContribution = gql`
  mutation ($id: Int!) {
    rejectContribution(id: $id)
  }
`
