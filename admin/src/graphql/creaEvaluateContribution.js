import gql from 'graphql-tag'

export const creaEvaluateContribution = gql`
  mutation ($input: CreaContributionInput!) {
    creaEvaluateContribution(input: $input) {
      beitragRef
      overallVerdict
      discrepancy
      appliedRule
      confidence
      reasoning
      responseText
      activities {
        activity
        categoryKey
        outputType
        hours
        hoursEstimated
        verdict
        confidence
      }
      openPoints {
        question
        options
        relatesTo
      }
      flags
    }
  }
`
