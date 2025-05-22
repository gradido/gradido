import { gql } from 'graphql-request'

export const disburseJwt = gql`
  mutation ($args: DisburseJwtArgs!) {
    disburseJwt(data: $args) {
      jwt
    }
  }
`

export const disburseJwtArgs = gql`
  input DisburseJwtArgs {
    jwt: String!
  }
`
