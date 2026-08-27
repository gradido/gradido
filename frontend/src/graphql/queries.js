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
      emailChecked
      # The address that is IN FORCE. The settings page reads it from the store, and the
      # store used to get it from exactly one place - the login form - so it showed "the
      # address you last signed in with" and nothing renewed it. A member who changed
      # their address and confirmed it kept seeing the old one, through a reload as well,
      # because the store is persisted; only signing in again with the new address helped,
      # and that was the one thing that ever could. Deliberately NOT on the login mutation
      # next to it: that runs on an inalienable right, so it has no authenticated caller,
      # and the field resolver hands a contact row to nobody but its owner - the same
      # reason the avatar is not there either.
      #
      # (No backticks in here: this is a GraphQL comment inside a gql template literal, so
      # one would end the literal. Nothing warns about it - the file simply becomes a
      # different, still-parseable program.)
      emailContact {
        email
      }
      createdAt
      firstName
      lastName
      language
      klickTipp {
        newsletterState
      }
      gmsAllowed
      humhubAllowed
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
        userAlias
        userAvatarColorIndex
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

export const assistedRegistrationInfo = gql`
  query ($assistCode: String!) {
    assistedRegistrationInfo(assistCode: $assistCode) {
      firstName
      lastName
    }
  }
`
