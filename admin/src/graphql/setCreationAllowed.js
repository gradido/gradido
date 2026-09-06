// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

// ES-021: the administrator's "may create" switch, both directions. Answers with the
// value now on the row.
export const setCreationAllowed = gql`
  mutation ($userId: Int!, $allowed: Boolean!) {
    setCreationAllowed(userId: $userId, allowed: $allowed)
  }
`
