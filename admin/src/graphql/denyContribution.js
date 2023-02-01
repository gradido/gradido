import gql from 'graphql-tag'

export const denyContribution = gql`
  mutation ($id: Int!) {
    denyContribution(id: $id)
  }
`
