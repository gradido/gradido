// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

/** What the member may still create, for each of the months a contribution can be dated to. */
export const openCreations = gql`
  query {
    openCreations {
      year
      month
      amount
    }
  }
`
