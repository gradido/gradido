// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

/**
 * The moderation's remark on a member, written anew by the signed-in moderator; an emptied remark
 * takes it away (the answer is then null). The card of an opened contribution READS it with the
 * messages of the contribution, in one round trip (adminListContributionMessages.ts).
 *
 * ⛔ `$remark` by this name: the server keeps a variable so named out of its log
 * (backend/src/server/plugins.ts, filterVariables).
 */
export const setUserRemark = gql`
  mutation ($userId: Int!, $remark: String!) {
    setUserRemark(userId: $userId, remark: $remark) {
      remark
      updatedAt
      updatedByName
    }
  }
`

/**
 * The remark on one member, read on its own: Crea's window is opened from the row of a
 * contribution, without its messages (Bernd, 28.10.2026).
 */
export const userRemark = gql`
  query ($userId: Int!) {
    userRemark(userId: $userId) {
      remark
      updatedAt
      updatedByName
    }
  }
`
