import gql from 'graphql-tag'

// Rewrite the reply text when the moderator deviates from Crea's recommendation
// (E-017). A confirm rewrite also returns memoSupplement — the short public note the
// moderator appends to the contribution ("Text ergänzen", E-019); null otherwise.
// No re-evaluation, no persistence.
export const creaRewriteResponse = gql`
  mutation ($input: CreaContributionInput!) {
    creaRewriteResponse(input: $input) {
      responseText
      memoSupplement
    }
  }
`
