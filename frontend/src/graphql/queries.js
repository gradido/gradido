import gql from 'graphql-tag'

// The pictures of other members, asked for by the pair that identifies them. Only for the
// ones the wallet does not already hold in useMemberAvatars -- a booking list carries a
// date per member, and everything whose date still matches is already on this device.
//
// A member with nothing to show is simply absent from the answer; the backend decides that
// (switch off, deleted, another community) and this side never learns which.
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

export const verifyLogin = gql`
  query {
    verifyLogin {
      gradidoID
      alias
      firstName
      lastName
      language
      klickTipp {
        newsletterState
      }
      gmsAllowed
      humhubAllowed
      gmsPublishName
      humhubPublishName
      gmsPublishLocation
      userLocation
      hasElopage
      publisherId
      roles
      hideAmountGDD
      hideAmountGDT
      aboutMe
      avatar
      avatarVisibleToMembers
    }
  }
`

// The full 512x512 crop, on demand. Deliberately not a field on verifyLogin above: it is
// about ten times the everyday rendition and is wanted at two moments only -- printing
// the member card, and looking at one's own picture -- so the common paths do not carry
// it. Takes no argument, so there is nobody to ask about but oneself.
export const avatarFull = gql`
  query {
    avatarFull
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
      createdAt
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

export const transactionsQuery = gql`
  query ($currentPage: Int = 1, $pageSize: Int = 25, $order: Order = DESC) {
    transactionList(currentPage: $currentPage, pageSize: $pageSize, order: $order) {
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

export const checkUsername = gql`
  query ($username: String!) {
    checkUsername(username: $username)
  }
`

export const queryTransactionLink = gql`
  query ($code: String!) {
    queryTransactionLink(code: $code) {
      ... on TransactionLink {
        id
        amount
        memo
        createdAt
        validUntil
        redeemedAt
        deletedAt
        senderUser {
          gradidoID
          alias
          publisherId
        }
        communities {
          foreign
          name
          description
          url
          uuid
        }
      }
      ... on RedeemJwtLink {
        amount
        memo
        code
        validUntil
        senderCommunity {
          foreign
          name
          description
          url
          uuid
        }
        senderUser {
          gradidoID
          alias
        }
        recipientCommunity {
          foreign
          name
          description
          url
          uuid
        }
        recipientUser {
          gradidoID
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
  query ($currentPage: Int = 1, $pageSize: Int = 5) {
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
  query ($currentPage: Int = 1, $pageSize: Int = 25, $order: Order = DESC) {
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

export const communityStatistics = gql`
  query {
    communityStatistics {
      totalUsers
    }
  }
`

export const searchAdminUsers = gql`
  query ($pageSize: Int = 25, $currentPage: Int = 1, $order: Order = ASC) {
    searchAdminUsers(pageSize: $pageSize, currentPage: $currentPage, order: $order) {
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
        userFirstName
        userLastName
        userAlias
        userId
      }
    }
  }
`

export const user = gql`
  query ($identifier: String!, $communityIdentifier: String!) {
    user(identifier: $identifier, communityIdentifier: $communityIdentifier) {
      alias
      gradidoID
    }
  }
`
