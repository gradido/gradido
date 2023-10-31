import { gql } from 'graphql-request'

export const openConnection = gql`
  mutation ($args: OpenConnectionArgs!) {
    openConnection(data: $args)
  }
`
