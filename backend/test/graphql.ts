import gql from 'graphql-tag'

export const createUserMutation = gql`
  mutation (
    $email: String!
    $firstName: String!
    $lastName: String!
    $language: String!
    $publisherId: Int
  ) {
    createUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      language: $language
      publisherId: $publisherId
    )
  }
`

export const setPasswordMutation = gql`
  mutation ($code: String!, $password: String!) {
    setPassword(code: $code, password: $password)
  }
`
