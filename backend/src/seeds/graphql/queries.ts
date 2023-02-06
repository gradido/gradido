import gql from 'graphql-tag'

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
    }
  }
`

export const queryOptIn = gql`
  query ($optIn: String!) {
    queryOptIn(optIn: $optIn)
  }
`

export const transactionsQuery = gql`
  query (
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
      balance
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
  query ($email: String!) {
    sendResetPasswordEmail(email: $email)
  }
`

export const searchUsers = gql`
  query ($searchText: String!, $currentPage: Int, $pageSize: Int, $filters: SearchUsersFilters) {
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
        isAdmin
      }
    }
  }
`

export const listGDTEntriesQuery = gql`
  query ($currentPage: Int!, $pageSize: Int!) {
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
  query ($code: String!) {
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

export const listContributions = gql`
  query (
    $currentPage: Int = 1
    $pageSize: Int = 5
    $order: Order
    $filterConfirmed: Boolean = false
  ) {
    listContributions(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      filterConfirmed: $filterConfirmed
    ) {
      contributionCount
      contributionList {
        id
        amount
        memo
      }
    }
  }
`

export const listAllContributions = `
query ($currentPage: Int = 1, $pageSize: Int = 5, $order: Order = DESC, $statusFilter: [ContributionStatus!]) {
  listAllContributions(currentPage: $currentPage, pageSize: $pageSize, order: $order, statusFilter: $statusFilter) {
  	contributionCount
    contributionList {
      id
      firstName
      lastName
      amount
      memo
      createdAt
      confirmedAt
      confirmedBy
      contributionDate
      state
      messagesCount
      deniedAt
      deniedBy
    }
	}
}
`
// from admin interface

export const adminListAllContributions = gql`
  query (
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $statusFilter: [ContributionStatus!]
  ) {
    adminListAllContributions(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      statusFilter: $statusFilter
    ) {
      contributionCount
      contributionList {
        id
        firstName
        lastName
        amount
        memo
        createdAt
        confirmedAt
        confirmedBy
        contributionDate
        state
        messagesCount
        deniedAt
        deniedBy
      }
    }
  }
`

export const listTransactionLinksAdmin = gql`
  query (
    $userId: Int!
    $filters: TransactionLinkFilters
    $currentPage: Int = 1
    $pageSize: Int = 5
  ) {
    listTransactionLinksAdmin(
      userId: $userId
      filters: $filters
      currentPage: $currentPage
      pageSize: $pageSize
    ) {
      linkCount
      linkList {
        id
        amount
        holdAvailableAmount
        memo
        code
        createdAt
        validUntil
        redeemedAt
        deletedAt
      }
    }
  }
`

export const listContributionLinks = gql`
  query ($pageSize: Int = 25, $currentPage: Int = 1, $order: Order) {
    listContributionLinks(pageSize: $pageSize, currentPage: $currentPage, order: $order) {
      links {
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
      count
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
  query ($contributionId: Float!, $pageSize: Int = 25, $currentPage: Int = 1, $order: Order = ASC) {
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
