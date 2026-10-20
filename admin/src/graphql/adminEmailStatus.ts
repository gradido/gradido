// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

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
