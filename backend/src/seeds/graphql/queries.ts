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
export const authenticateGmsUserSearch = gql`
  query {
    authenticateGmsUserSearch {
      url
      token
    }
  }
`

export const userLocationQuery = gql`
  query {
    userLocation {
      userLocation
      communityLocation
    }
  }
`

export const queryOptIn = gql`
  query ($optIn: String!) {
    queryOptIn(optIn: $optIn)
  }
`

export const pendingEmailChange = gql`
  query {
    pendingEmailChange {
      email
      requestedAt
      resendAllowedAt
    }
  }
`

export const adminEmailStatus = gql`
  query ($userId: Int!) {
    adminEmailStatus(userId: $userId) {
      gdtEmail
      currentConfirmed
      elopageBuysOnCurrent
      pendingEmail
      pendingSince
    }
  }
`

export const aliasStatus = gql`
  query {
    aliasStatus {
      changesLeft
      nextChangeAt
      ownAliases
      aliasSettled
    }
  }
`

export const checkUsername = gql`
  query ($username: String!) {
    checkUsername(username: $username)
  }
`

// ⚠️ Kept field-for-field in step with the wallet's `transactionFields` fragment
// (frontend/src/graphql/transactions.graphql), and with its arguments. The wallet's own
// document is validated against the schema by documents.test.ts; this one is the copy the
// resolver tests EXECUTE, so a field or argument the wallet sends and this one does not is
// a path those tests never exercise.
export const transactionsQuery = gql`
  query (
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $counterparty: MemberAvatarRefInput = null
  ) {
    transactionList(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      counterparty: $counterparty
    ) {
      balance {
        balance
        balanceGDT
        count
        linkCount
        openLinkCount
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
          communityUuid
          communityName
          gradidoID
          alias
          avatarUpdatedAt
        }
        decay {
          decay
          start
          end
          duration
        }
        linkId
        viaThankYouCard
        thankYouCardLabel
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

export const reachableCommunities = gql`
  query { 
    reachableCommunities {
      foreign
      uuid
      name
      description
      url
    }
  }
`

export const getCommunityByIdentifierQuery = gql`
  query ($communityIdentifier: String!) {
    communityByIdentifier(communityIdentifier: $communityIdentifier) {
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

export const getHomeCommunityQuery = gql`
  query {
    homeCommunity {
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

export const allCommunities = gql`
  query {
    allCommunities {
      foreign
      url
      publicKey
      uuid
      authenticatedAt
      name
      description
      gmsApiKey
      creationDate
      createdAt
      updatedAt
      federatedCommunities {
        id
        apiVersion
        endPoint
        lastAnnouncedAt
        verifiedAt
        lastErrorAt
        createdAt
        updatedAt
      }
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
  query ($pagination: Paginated!) {
    listContributions(pagination: $pagination) {
      contributionCount
      contributionList {
        id
        amount
        memo
        contributionDate
        contributionStatus
        messagesCount
        createdAt
        confirmedAt
        confirmedBy
        deniedAt
        deniedBy
        updatedBy
        updatedAt
        deletedAt
        moderatorId
      }
    }
  }
`

export const listAllContributions = gql`
query ($pagination: Paginated!) {
  listAllContributions(pagination: $pagination) {
  	contributionCount
    contributionList {
      id
      user {
        firstName
        lastName
      }
      amount
      memo
      createdAt
      confirmedAt
      confirmedBy
      contributionDate
      contributionStatus
      messagesCount
      deniedAt
      deniedBy
    }
	}
}
`
// from admin interface

export const adminListContributions = gql`
  query ($filter: SearchContributionsFilterArgs, $paginated: Paginated) {
    adminListContributions(filter: $filter, paginated: $paginated) {
      contributionCount
      contributionList {
        id
        user {
          emailContact {
            email
          }
          firstName
          lastName
        }
        amount
        memo
        createdAt
        confirmedAt
        confirmedBy
        contributionDate
        contributionStatus
        messagesCount
        deniedAt
        deniedBy
        creationGroups {
          id
          tag
          name
        }
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
        alias
        role
        visibleCreationGroups
        seesAllCreationGroups
        seesUntagged
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
        userAlias
        userAvatarColorIndex
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
        userAlias
        userAvatarColorIndex
        userId
      }
    }
  }
`

// Written out exactly as frontend/src/graphql/queries.js sends it. The input type name
// and the argument name are produced by type-graphql from class names on this side and
// typed by hand on the other, and nothing links the two -- so a rename here would leave
// the wallet sending a document the schema rejects, at runtime, with nothing red before.
// This document is that link: it goes through the real schema on every backend test run.
export const memberAvatars = gql`
  query ($refs: [MemberAvatarRefInput!]!) {
    memberAvatars(refs: $refs) {
      gradidoID
      communityUuid
      avatar
      avatarUpdatedAt
    }
  }
`

// One member, one click, the 512 crop. Through the real schema for the same reason as the
// batched reader above: the input type name and the argument name come out of type-graphql
// and are typed by hand in the wallet, with nothing linking the two.
export const memberAvatarFull = gql`
  query ($ref: MemberAvatarRefInput!) {
    memberAvatarFull(ref: $ref)
  }
`

export const user = gql`
  query ($identifier: String!, $communityIdentifier: String!) {
    user(identifier: $identifier, communityIdentifier: $communityIdentifier) {
      firstName
      lastName
      foreign
      communityUuid
      gradidoID
      alias
    }
  }
`

export const listMatchingEntries = gql`
  query {
    listMatchingEntries {
      uuid
      matchingType
      summary
      details
      remote
      active
    }
  }
`

// Two narrow queries for the aboutMe field resolver: the shared `user` and
// `verifyLogin` queries are asserted on elsewhere, so this asks for the field on its
// own rather than widening them.
export const verifyLoginAboutMe = gql`
  query {
    verifyLogin {
      gradidoID
      aboutMe
    }
  }
`

// Same reasoning: the avatar rides along on verifyLogin, and asking for it on its own
// leaves the widely asserted queries untouched.
export const verifyLoginAvatar = gql`
  query {
    verifyLogin {
      gradidoID
      avatar
    }
  }
`

// Own view only, and it takes no argument -- there is nobody to ask about but oneself.
export const avatarFull = gql`
  query {
    avatarFull
  }
`

export const userAvatar = gql`
  query ($identifier: String!, $communityIdentifier: String!) {
    user(identifier: $identifier, communityIdentifier: $communityIdentifier) {
      gradidoID
      avatar
    }
  }
`

export const userAboutMe = gql`
  query ($identifier: String!, $communityIdentifier: String!) {
    user(identifier: $identifier, communityIdentifier: $communityIdentifier) {
      gradidoID
      aboutMe
    }
  }
`

export const thankYouCardPaymentTarget = gql`
  query ($code: String!) {
    thankYouCardPaymentTarget(code: $code) {
      status
      cardLabel
    }
  }
`

export const assistedRegistrationInfo = gql`
  query ($assistCode: String!) {
    assistedRegistrationInfo(assistCode: $assistCode) {
      firstName
      lastName
    }
  }
`

export const creaSettings = gql`
  query {
    creaSettings {
      model
      effort
      defaultModel
      fastMode
      matchingKeyingActive
    }
  }
`

export const contactList = gql`
  query ($currentPage: Int = 1, $pageSize: Int = 25, $search: String) {
    contactList(currentPage: $currentPage, pageSize: $pageSize, search: $search) {
      count
      contacts {
        user {
          gradidoID
          communityUuid
          communityName
          alias
          firstName
          lastName
        }
        firstAt
        lastAt
        bookings
        favorite
        homeCommunity
      }
    }
  }
`

export const favoriteList = gql`
  query {
    favoriteList {
      communityUuid
      gradidoID
    }
  }
`
