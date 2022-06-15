import gql from 'graphql-tag'

export const adminCreateContributions = gql`
  mutation ($pendingCreations: [AdminCreateContributionArgs!]!) {
    adminCreateContributions(pendingCreations: $pendingCreations) {
      success
      successfulContribution
      failedContribution
    }
  }
`
