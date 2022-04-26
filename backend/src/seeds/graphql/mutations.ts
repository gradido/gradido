import gql from 'graphql-tag'

export const subscribeNewsletter = gql`
  mutation ($email: String!, $language: String!) {
    subscribeNewsletter(email: $email, language: $language)
  }
`

export const unsubscribeNewsletter = gql`
  mutation ($email: String!) {
    unsubscribeNewsletter(email: $email)
  }
`

export const setPassword = gql`
  mutation ($code: String!, $password: String!) {
    setPassword(code: $code, password: $password)
  }
`

export const forgotPassword = gql`
  mutation ($email: String!) {
    forgotPassword(email: $email)
  }
`

export const updateUserInfos = gql`
  mutation (
    $firstName: String
    $lastName: String
    $password: String
    $passwordNew: String
    $locale: String
    $coinanimation: Boolean
  ) {
    updateUserInfos(
      firstName: $firstName
      lastName: $lastName
      password: $password
      passwordNew: $passwordNew
      language: $locale
      coinanimation: $coinanimation
    )
  }
`

export const createUser = gql`
  mutation (
    $firstName: String!
    $lastName: String!
    $email: String!
    $language: String!
    $publisherId: Int
    $redeemCode: String
  ) {
    createUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      language: $language
      publisherId: $publisherId
      redeemCode: $redeemCode
    ) {
      id
    }
  }
`

export const sendCoins = gql`
  mutation ($email: String!, $amount: Decimal!, $memo: String!) {
    sendCoins(email: $email, amount: $amount, memo: $memo)
  }
`

export const createTransactionLink = gql`
  mutation ($amount: Decimal!, $memo: String!) {
    createTransactionLink(amount: $amount, memo: $memo) {
      id
      code
    }
  }
`

// from admin interface

export const createPendingCreation = gql`
  mutation (
    $email: String!
    $amount: Float!
    $memo: String!
    $creationDate: String!
    $moderator: Int!
  ) {
    createPendingCreation(
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
      moderator: $moderator
    )
  }
`

export const confirmPendingCreation = gql`
  mutation ($id: Int!) {
    confirmPendingCreation(id: $id)
  }
`
