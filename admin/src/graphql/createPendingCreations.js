import gql from 'graphql-tag'

export const createPendingCreations = gql`
  mutation ($pendingCreations: [AdminCreateContributionArgs!]!) {
    createPendingCreations(pendingCreations: $pendingCreations) {
      success
      successfulCreation
      failedCreation
    }
  }
`
