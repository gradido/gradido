import gql from 'graphql-tag'

export const login = gql`
  query($email: String!, $password: String!, $publisherId: Int) {
    login(email: $email, password: $password, publisherId: $publisherId) {
      email
      firstName
      lastName
      language
      coinanimation
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      isAdmin
    }
  }
`

export const verifyLogin = gql`
  query {
    verifyLogin {
      email
      firstName
      lastName
      language
      coinanimation
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
  query {
    logout
  }
`

export const transactionsQuery = gql`
  query(
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $onlyCreations: Boolean = false
  ) {
    transactionList(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      onlyCreations: $onlyCreations
    ) {
      balanceGDT
      count
      linkCount
      balance
      decayStartBlock
      transactions {
        id
        typeId
        amount
        balance
        balanceDate
        memo
        linkedUser {
          firstName
          lastName
        }
        decay {
          decay
          start
          end
          duration
        }
      }
    }
  }
`

export const sendResetPasswordEmail = gql`
  query($email: String!) {
    sendResetPasswordEmail(email: $email)
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

export const communityInfo = gql`
  query {
    getCommunityInfo {
      name
      description
      registerUrl
      url
    }
  }
`

export const communities = gql`
  query {
    communities {
      id
      name
      url
      description
      registerUrl
    }
  }
`

export const queryTransactionLink = gql`
  query($code: String!) {
    queryTransactionLink(code: $code) {
      amount
      memo
      createdAt
      validUntil
      user {
        firstName
        publisherId
      }
    }
  }
`

export const listTransactionLinks = gql`
  query($currentPage: Int = 1, $pageSize: Int = 5) {
    listTransactionLinks(currentPage: $currentPage, pageSize: $pageSize) {
      id
      amount
      holdAvailableAmount
      memo
      code
      createdAt
      validUntil
      redeemedAt
    }
  }
`
