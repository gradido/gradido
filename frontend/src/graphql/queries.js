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

export const logout = gql`
  query($sessionId: Float!) {
    logout(sessionId: $sessionId)
  }
`

export const resetPassword = gql`
  query($sessionId: Float!, $email: String!, $password: String!) {
    resetPassword(sessionId: $sessionId, email: $email, password: $password)
  }
`

export const loginViaEmailVerificationCode = gql`
  query($optin: String!) {
    loginViaEmailVerificationCode(optin: $optin) {
      sessionId
      email
    }
  }
`

export const updateUserInfos = gql`
  query(
    $sessionId: Float!
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
      sessionId: $sessionId
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
