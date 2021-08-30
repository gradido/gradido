import gql from 'graphql-tag'

export const login = gql`
  query($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`

export const logout = gql`
  query {
    logout
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

export const transactionsQuery = gql`
  query($firstPage: Int = 1, $items: Int = 25, $order: String = "DESC") {
    transactionList(firstPage: $firstPage, items: $items, order: $order) {
      gdtSum
      count
      balance
      decay
      decayDate
      transactions {
        type
        balance
        decayStart
        decayEnd
        decayDuration
        memo
        transactionId
        name
        email
        date
        decay {
          balance
          decayStart
          decayEnd
          decayDuration
          decayStartBlock
        }
      }
    }
  }
`

export const resgisterUserQuery = gql`
  query($firstName: String!, $lastName: String!, $email: String!, $password: String!) {
    create(email: $email, firstName: $firstName, lastName: $lastName, password: $password)
  }
`

export const sendCoins = gql`
  query($sessionId: Float!, $email: String!, $amount: Float!, $memo: String!) {
    sendCoins(sessionId: $sessionId, email: $email, amount: $amount, memo: $memo)
  }
`

export const sendResetPasswordEmail = gql`
  query($email: String!) {
    sendResetPasswordEmail(email: $email) {
      state
    }
  }
`

export const checkUsername = gql`
  query($username: String!) {
    checkUsername(username: $username) {
      state
    }
  }
`

export const listGDTEntriesQuery = gql`
  query($currentPage: Int!, $pageSize: Int!, $sessionId: Float!) {
    listGDTEntries(currentPage: $currentPage, pageSize: $pageSize, sessionId: $sessionId) {
      count
      gdtEntries {
        amount
        date
        comment
        gdtEntryType
        factor
        gdt
      }
      gdtSum
    }
  }
`
