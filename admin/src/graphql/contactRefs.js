// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

/**
 * Everybody the signed-in moderator is in contact with, as pairs -- their OWN contacts, asked
 * for with the right their contact list in the wallet has (a moderator's token carries the
 * member rights, ROLES.ts).
 *
 * For what stands behind a member's name in a list (components/MemberWalletLink.vue): where
 * the moderator is in contact with the member, the way into the conversation with them. One
 * answer for a whole page of members; see `composables/useModeratorContacts`.
 */
export const contactRefs = gql`
  query {
    contactRefs {
      communityUuid
      gradidoID
    }
  }
`
