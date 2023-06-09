import gql from 'graphql-tag'

export const verifyLogin = gql`
  query {
    verifyLogin {
      gradidoID
      firstName
      lastName
      language
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      isAdmin
      hideAmountGDD
      hideAmountGDT
    }
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
        previousBalance
        balanceDate
        memo
        linkedUser {
          firstName
          lastName
          gradidoID
        }
        decay {
          decay
          start
          end
          duration
        }
        linkId
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

export const checkUsername = gql`
  query($username: String!) {
    checkUsername(username: $username)
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
          gradidoID
          firstName
          publisherId
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
      links {
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
  }
`

export const listContributionLinks = gql`
  query($currentPage: Int = 1, $pageSize: Int = 25, $order: Order = DESC) {
    listContributionLinks(currentPage: $currentPage, pageSize: $pageSize, order: $order) {
      links {
        id
        amount
        name
        memo
        createdAt
        validFrom
        validTo
        maxAmountPerMonth
        cycle
        maxPerCycle
      }
      count
    }
  }
`

export const listContributions = gql`
  query(
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $statusFilter: [ContributionStatus!]
  ) {
    listContributions(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      statusFilter: $statusFilter
    ) {
      contributionCount
      contributionList {
        id
        amount
        memo
        createdAt
        contributionDate
        confirmedAt
        confirmedBy
        deletedAt
        state
        messagesCount
        deniedAt
        deniedBy
        moderatorId
      }
    }
  }
`

export const listAllContributions = gql`
  query($currentPage: Int = 1, $pageSize: Int = 25, $order: Order = DESC) {
    listAllContributions(currentPage: $currentPage, pageSize: $pageSize, order: $order) {
      contributionCount
      contributionList {
        id
        firstName
        lastName
        amount
        memo
        createdAt
        contributionDate
        confirmedAt
        confirmedBy
        state
        messagesCount
        deniedAt
        deniedBy
      }
    }
  }
`

export const communityStatistics = gql`
  query {
    communityStatistics {
      totalUsers
    }
  }
`

export const searchAdminUsers = gql`
  query {
    searchAdminUsers {
      userCount
      userList {
        firstName
        lastName
      }
    }
  }
`

export const listContributionMessages = gql`
  query($contributionId: Int!, $pageSize: Int = 25, $currentPage: Int = 1, $order: Order = ASC) {
    listContributionMessages(
      contributionId: $contributionId
      pageSize: $pageSize
      currentPage: $currentPage
      order: $order
    ) {
      count
      messages {
        id
        message
        createdAt
        updatedAt
        type
        userFirstName
        userLastName
        userId
      }
    }
  }
`

export const openCreations = gql`
  query {
    openCreations {
      year
      month
      amount
    }
  }
`

export const user = gql`
  query($identifier: String!) {
    user(identifier: $identifier) {
      firstName
      lastName
    }
  }
`
