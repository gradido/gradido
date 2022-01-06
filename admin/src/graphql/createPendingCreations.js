import gql from 'graphql-tag'

export const createPendingCreations = gql`
  mutation ($pendingCreations: [CreatePendingCreationArgs!]!) {
    createPendingCreations(pendingCreations: $pendingCreations) {
      success
      successfulCreation
      failedCreation
    }
  }
`
