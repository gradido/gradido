import { gql } from 'graphql-request'

export const openConnectionCallback = gql`
  mutation ($args: OpenConnectionCallbackArgs!) {
    openConnectionCallback(data: $args)
  }
`
