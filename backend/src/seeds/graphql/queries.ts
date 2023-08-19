import { gql } from 'graphql-tag'

export const verifyLogin = gql`
  query {
    verifyLogin {
      firstName
      lastName
      language
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      roles
    }
  }
`

export const queryOptIn = gql`
  query ($optIn: String!) {
    queryOptIn(optIn: $optIn)
  }
`

export const checkUsername = gql`
  query ($username: String!) {
    checkUsername(username: $username)
  }
`

export const transactionsQuery = gql`
  query ($currentPage: Int = 1, $pageSize: Int = 25, $order: Order = DESC) {
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

export const sendResetPasswordEmail = gql`
  query ($email: String!) {
    sendResetPasswordEmail(email: $email)
  }
`

export const searchUsers = gql`
  query (
    $query: String!
    $filters: SearchUsersFilters
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = ASC
  ) {
    searchUsers(
      query: $query
      filters: $filters
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
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
        roles
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

export const getCommunities = gql`
  query {
    getCommunities {
      id
      foreign
      publicKey
      url
      lastAnnouncedAt
      verifiedAt
      lastErrorAt
      createdAt
      updatedAt
    }
  }
`

export const getCommunitySelections = gql`
  query {
    getCommunitySelections {
      id
      foreign
      name
      description
      url
      creationDate
      uuid
      authenticatedAt
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
        status
        messagesCount
        deniedAt
        deniedBy
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
      status
      messagesCount
      deniedAt
      deniedBy
    }
	}
}
`
// from admin interface

export const adminListContributions = gql`
  query (
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $statusFilter: [ContributionStatus!]
    $userId: Int
    $query: String
    $noHashtag: Boolean
  ) {
    adminListContributions(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      statusFilter: $statusFilter
      userId: $userId
      query: $query
      noHashtag: $noHashtag
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
        status
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
      count
      links {
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
        role
      }
    }
  }
`

export const listContributionMessages = gql`
  query ($contributionId: Int!, $pageSize: Int = 25, $currentPage: Int = 1, $order: Order = ASC) {
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

export const adminListContributionMessages = gql`
  query ($contributionId: Int!, $pageSize: Int = 25, $currentPage: Int = 1, $order: Order = ASC) {
    adminListContributionMessages(
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

export const user = gql`
  query ($identifier: String!) {
    user(identifier: $identifier) {
      firstName
      lastName
    }
  }
`
