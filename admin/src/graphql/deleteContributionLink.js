import gql from 'graphql-tag'

export const deleteContributionLink = gql`
  mutation ($id: Int!) {
    deleteContributionLink(id: $id)
  }
`
