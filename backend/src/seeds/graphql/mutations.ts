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
  ) {
    updateUserInfos(
      firstName: $firstName
      lastName: $lastName
      password: $password
      passwordNew: $passwordNew
      language: $locale
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

export const adminCreateContributions = gql`
  mutation ($pendingCreations: [AdminCreateContributionArgs!]!) {
    adminCreateContributions(pendingCreations: $pendingCreations) {
      success
      successfulContribution
      failedContribution
    }
  }
`

export const adminUpdateContribution = gql`
  mutation ($id: Int!, $email: String!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    adminUpdateContribution(
      id: $id
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
    ) {
      amount
      date
      memo
      creation {
        amount
        targetMonth
      }
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
      date
      firstName
      lastName
      moderator
      creation {
        amount
        targetMonth
      }
      state
      messageCount
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

export const createContributionMessage = gql`
  mutation ($contributionId: Float!, $message: String!) {
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
  mutation ($contributionId: Float!, $message: String!) {
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
