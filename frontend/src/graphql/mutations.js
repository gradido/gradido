import gql from 'graphql-tag'

export const subscribeNewsletter = gql`
  mutation($email: String!, $language: String!) {
    subscribeNewsletter(email: $email, language: $language)
  }
`

export const unsubscribeNewsletter = gql`
  mutation($email: String!) {
    unsubscribeNewsletter(email: $email)
  }
`

export const resetPassword = gql`
  mutation($sessionId: Float!, $email: String!, $password: String!) {
    resetPassword(sessionId: $sessionId, email: $email, password: $password)
  }
`

export const updateUserInfos = gql`
  query(
    $email: String!
    $firstName: String
    $lastName: String
    $description: String
    $username: String
    $password: String
    $passwordNew: String
    $locale: String
  ) {
    updateUserInfos(
      email: $email
      firstName: $firstName
      lastName: $lastName
      description: $description
      username: $username
      password: $password
      passwordNew: $passwordNew
      language: $locale
    ) {
      validValues
    }
  }
`
