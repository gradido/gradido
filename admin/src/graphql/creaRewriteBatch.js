import gql from 'graphql-tag'

// Batch rewrite (E-020): the moderator deviates from Crea's overall batch verdict
// (confirm/inquire/deny + optional context) and Crea writes ONE fresh joint reply for
// all contributions. Does not re-judge; no memoSupplement in batch mode (the public
// per-contribution note is single-contribution only, E-019).
export const creaRewriteBatch = gql`
  mutation ($input: CreaBatchInput!) {
    creaRewriteBatch(input: $input) {
      responseText
      memoSupplement
    }
  }
`
