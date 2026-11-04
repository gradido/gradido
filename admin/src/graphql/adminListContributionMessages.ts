// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

// With the messages, the moderation's remark on the member who handed the contribution in (Bernd,
// 28.10.2026): one round trip, so that the card of an opened contribution takes its shape once.
// Written with setUserRemark (userRemark.ts).
export const adminListContributionMessages = gql`
  query (
    $contributionId: Int!
    $userId: Int!
    $pageSize: Int = 25
    $currentPage: Int = 1
    $order: Order = ASC
  ) {
    userRemark(userId: $userId) {
      remark
      updatedAt
      updatedByName
    }
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
        userId
        userAvatarColorIndex
        userGradidoID
        userCommunityUuid
        userAvatarUpdatedAt
        isModerator
      }
    }
  }
`
