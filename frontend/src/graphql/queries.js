import gql from 'graphql-tag'

export const login = gql`
  query($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      email
      username
      firstName
      lastName
      language
      description
      klickTipp {
        newsletterState
      }
    }
  }
`

export const logout = gql`
  query {
    logout
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

export const transactionsQuery = gql`
  query($currentPage: Int = 1, $pageSize: Int = 25, $order: String = "DESC") {
    transactionList(currentPage: $currentPage, pageSize: $pageSize, order: $order) {
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
  query($currentPage: Int!, $pageSize: Int!) {
    listGDTEntries(currentPage: $currentPage, pageSize: $pageSize) {
      count
      gdtEntries {
        id
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

export const checkEmailQuery = gql`
  query($optin: String!) {
    checkEmail(optin: $optin) {
      email
      sessionId
    }
  }
`
