import gql from 'graphql-tag'

export const login = gql`
  query($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      sessionId
      user {
        email
        firstName
        lastName
        language
        username
        description
      }
    }
  }
`
