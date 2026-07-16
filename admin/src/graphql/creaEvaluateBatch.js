import gql from 'graphql-tag'

// Batch evaluation (E-020): several open contributions of one participant judged
// together into ONE overall verdict + ONE reply. Slim result - no per-activity data
// (activities/discrepancy/appliedRule) and no persistence in batch mode.
export const creaEvaluateBatch = gql`
  mutation ($input: CreaBatchInput!) {
    creaEvaluateBatch(input: $input) {
      overallVerdict
      confidence
      reasoning
      responseText
      openPoints {
        question
        options
        relatesTo
      }
      flags
    }
  }
`
