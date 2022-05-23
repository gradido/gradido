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
  mutation ($email: String!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    createPendingCreation(email: $email, amount: $amount, memo: $memo, creationDate: $creationDate)
  }
`

export const confirmPendingCreation = gql`
  mutation ($id: Int!) {
    confirmPendingCreation(id: $id)
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

export const searchUsers = gql`
  query (
    $searchText: String!
    $currentPage: Int
    $pageSize: Int
    $filters: SearchUsersFiltersInput
  ) {
    searchUsers(
      searchText: $searchText
      currentPage: $currentPage
      pageSize: $pageSize
      filters: $filters
    ) {
      userCount
      userList {
        userId
        firstName
        lastName
        email
        creation
        emailChecked
        hasElopage
        emailConfirmationSend
        deletedAt
      }
    }
  }
`

export const createPendingCreations = gql`
  mutation ($pendingCreations: [CreatePendingCreationArgs!]!) {
    createPendingCreations(pendingCreations: $pendingCreations) {
      success
      successfulCreation
      failedCreation
    }
  }
`

export const updatePendingCreation = gql`
  mutation ($id: Int!, $email: String!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    updatePendingCreation(
      id: $id
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
    ) {
      amount
      date
      memo
      creation
    }
  }
`

export const deletePendingCreation = gql`
  mutation ($id: Int!) {
    deletePendingCreation(id: $id)
  }
`
