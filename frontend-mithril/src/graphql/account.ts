// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

// What somebody not signed in asks of the server: an account, a password, a confirmation.

export const createUser = gql`
  mutation (
    $firstName: String!
    $lastName: String!
    $email: String!
    $language: String!
    $redeemCode: String
    $redeemCodeCommunityUuid: String
    $project: String
    $referrerAlias: String
    $guarantorCode: String
    $password: String
  ) {
    createUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      language: $language
      redeemCode: $redeemCode
      redeemCodeCommunityUuid: $redeemCodeCommunityUuid
      project: $project
      referrerAlias: $referrerAlias
      guarantorCode: $guarantorCode
      password: $password
    )
  }
`

export const forgotPassword = gql`
  mutation ($email: String!) {
    forgotPassword(email: $email)
  }
`

export const queryOptIn = gql`
  query ($optIn: String!) {
    queryOptIn(optIn: $optIn)
  }
`

export const setPassword = gql`
  mutation ($code: String!, $password: String!) {
    setPassword(code: $code, password: $password)
  }
`

export const confirmEmail = gql`
  mutation ($code: String!) {
    confirmEmail(code: $code)
  }
`

export const confirmEmailChange = gql`
  mutation ($code: String!) {
    confirmEmailChange(code: $code)
  }
`

export const revokeEmailChange = gql`
  mutation ($vetoCode: String!) {
    revokeEmailChange(vetoCode: $vetoCode)
  }
`

export const projectBrandingBanner = gql`
  query ($project: String!) {
    projectBrandingBanner(alias: $project)
  }
`

export const authenticateHumhubAutoLogin = gql`
  mutation ($project: String!) {
    authenticateHumhubAutoLogin(project: $project)
  }
`

// The language of the account alone; the settings change more of it (step 9 of todo.md).
export const updateLanguage = gql`
  mutation ($locale: String!) {
    updateUserInfos(language: $locale)
  }
`
