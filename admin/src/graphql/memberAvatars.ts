// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

/**
 * The pictures of a list of members, in one round trip.
 *
 * The same two queries the wallet uses, and the same rights: a moderator's token carries
 * the member rights (ROLES.ts), so the moderation asks for a face exactly as a member does
 * -- and gets an answer only where the member shows one. Who that is, is decided in the
 * database (`mayBeShownToMembers`: local, not deleted, switch on); this side never learns
 * which of the reasons applied, and must not.
 *
 * Each row carries a DATE, not a picture, in the list that names it. Everything already
 * held under that date needs nothing -- see `composables/useMemberAvatars`.
 */
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

// ONE member's full-size picture, on a click. A query of its own rather than a second field
// above, because that one decorates a whole page and this one answers a tap: ten times the
// weight, wanted for one face out of twenty.
export const memberAvatarFull = gql`
  query ($ref: MemberAvatarRefInput!) {
    memberAvatarFull(ref: $ref)
  }
`
