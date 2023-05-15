import { gql } from 'graphql-tag'

export const subscribeNewsletter = gql`
  mutation {
    subscribeNewsletter
  }
`

export const unsubscribeNewsletter = gql`
  mutation {
    unsubscribeNewsletter
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
    $alias: String
    $password: String
    $passwordNew: String
    $locale: String
    $hideAmountGDD: Boolean
    $hideAmountGDT: Boolean
  ) {
    updateUserInfos(
      firstName: $firstName
      lastName: $lastName
      alias: $alias
      password: $password
      passwordNew: $passwordNew
      language: $locale
      hideAmountGDD: $hideAmountGDD
      hideAmountGDT: $hideAmountGDT
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

export const sendActivationEmail = gql`
  mutation ($email: String!) {
    sendActivationEmail(email: $email)
  }
`

export const sendCoins = gql`
  mutation ($identifier: String!, $amount: Decimal!, $memo: String!) {
    sendCoins(identifier: $identifier, amount: $amount, memo: $memo)
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

export const deleteTransactionLink = gql`
  mutation ($id: Int!) {
    deleteTransactionLink(id: $id)
  }
`

// from admin interface

export const adminCreateContribution = gql`
  mutation ($email: String!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    adminCreateContribution(
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
    )
  }
`

export const confirmContribution = gql`
  mutation ($id: Int!) {
    confirmContribution(id: $id)
  }
`

export const setUserRole = gql`
  mutation ($userId: Int!, $isAdmin: Boolean!) {
    setUserRole(userId: $userId, isAdmin: $isAdmin)
  }
`

export const deleteUser = gql`
  mutation ($userId: Int!) {
    deleteUser(userId: $userId)
  }
`

export const unDeleteUser = gql`
  mutation ($userId: Int!) {
    unDeleteUser(userId: $userId)
  }
`

export const adminUpdateContribution = gql`
  mutation ($id: Int!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    adminUpdateContribution(id: $id, amount: $amount, memo: $memo, creationDate: $creationDate) {
      amount
      date
      memo
    }
  }
`

export const adminDeleteContribution = gql`
  mutation ($id: Int!) {
    adminDeleteContribution(id: $id)
  }
`

export const createContributionLink = gql`
  mutation (
    $amount: Decimal!
    $name: String!
    $memo: String!
    $cycle: String!
    $validFrom: String
    $validTo: String
    $maxAmountPerMonth: Decimal
    $maxPerCycle: Int! = 1
  ) {
    createContributionLink(
      amount: $amount
      name: $name
      memo: $memo
      cycle: $cycle
      validFrom: $validFrom
      validTo: $validTo
      maxAmountPerMonth: $maxAmountPerMonth
      maxPerCycle: $maxPerCycle
    ) {
      id
      amount
      name
      memo
      code
      link
      createdAt
      validFrom
      validTo
      maxAmountPerMonth
      cycle
      maxPerCycle
    }
  }
`

export const updateContributionLink = gql`
  mutation (
    $amount: Decimal!
    $name: String!
    $memo: String!
    $cycle: String!
    $validFrom: String
    $validTo: String
    $maxAmountPerMonth: Decimal
    $maxPerCycle: Int! = 1
    $id: Int!
  ) {
    updateContributionLink(
      amount: $amount
      name: $name
      memo: $memo
      cycle: $cycle
      validFrom: $validFrom
      validTo: $validTo
      maxAmountPerMonth: $maxAmountPerMonth
      maxPerCycle: $maxPerCycle
      id: $id
    ) {
      id
      amount
      name
      memo
      code
      link
      createdAt
      validFrom
      validTo
      maxAmountPerMonth
      cycle
      maxPerCycle
    }
  }
`

export const deleteContributionLink = gql`
  mutation ($id: Int!) {
    deleteContributionLink(id: $id)
  }
`

export const createContribution = gql`
  mutation ($amount: Decimal!, $memo: String!, $creationDate: String!) {
    createContribution(amount: $amount, memo: $memo, creationDate: $creationDate) {
      id
      amount
      memo
    }
  }
`

export const updateContribution = gql`
  mutation ($contributionId: Int!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    updateContribution(
      contributionId: $contributionId
      amount: $amount
      memo: $memo
      creationDate: $creationDate
    ) {
      id
      amount
      memo
    }
  }
`

export const deleteContribution = gql`
  mutation ($id: Int!) {
    deleteContribution(id: $id)
  }
`

export const denyContribution = gql`
  mutation ($id: Int!) {
    denyContribution(id: $id)
  }
`

export const createContributionMessage = gql`
  mutation ($contributionId: Int!, $message: String!) {
    createContributionMessage(contributionId: $contributionId, message: $message) {
      id
      message
      createdAt
      updatedAt
      type
      userFirstName
      userLastName
    }
  }
`

export const adminCreateContributionMessage = gql`
  mutation ($contributionId: Int!, $message: String!) {
    adminCreateContributionMessage(contributionId: $contributionId, message: $message) {
      id
      message
      createdAt
      updatedAt
      type
      userFirstName
      userLastName
    }
  }
`

export const redeemTransactionLink = gql`
  mutation ($code: String!) {
    redeemTransactionLink(code: $code)
  }
`

export const login = gql`
  mutation ($email: String!, $password: String!, $publisherId: Int) {
    login(email: $email, password: $password, publisherId: $publisherId) {
      id
      firstName
      lastName
      language
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      isAdmin
    }
  }
`

export const logout = gql`
  mutation {
    logout
  }
`
