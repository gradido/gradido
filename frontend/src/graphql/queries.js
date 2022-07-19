import gql from 'graphql-tag'

export const login = gql`
  query($email: String!, $password: String!, $publisherId: Int) {
    login(email: $email, password: $password, publisherId: $publisherId) {
      email
      firstName
      lastName
      language
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      isAdmin
      creation
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
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      isAdmin
      creation
    }
  }
`

export const logout = gql`
  query {
    logout
  }
`

export const transactionsQuery = gql`
  query($currentPage: Int = 1, $pageSize: Int = 25, $order: Order = DESC) {
    transactionList(currentPage: $currentPage, pageSize: $pageSize, order: $order) {
      balance {
        balance
        balanceGDT
        count
        linkCount
      }
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
        linkedUser {
          email
        }
        transactionLinkId
      }
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

export const queryOptIn = gql`
  query($optIn: String!) {
    queryOptIn(optIn: $optIn)
  }
`

export const queryTransactionLink = gql`
  query($code: String!) {
    queryTransactionLink(code: $code) {
      ... on TransactionLink {
        id
        amount
        memo
        createdAt
        validUntil
        redeemedAt
        deletedAt
        user {
          firstName
          publisherId
          email
        }
      }
      ... on ContributionLink {
        id
        validTo
        validFrom
        amount
        name
        memo
        cycle
        createdAt
        code
        link
        deletedAt
        maxAmountPerMonth
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
      link
      createdAt
      validUntil
      redeemedAt
    }
  }
`
