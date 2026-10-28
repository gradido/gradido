// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

/**
 * The moderation's remark on a member, written anew by the signed-in moderator; an emptied remark
 * takes it away (the answer is then null). It is READ with the messages of the contribution, in
 * one round trip (adminListContributionMessages.ts).
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
