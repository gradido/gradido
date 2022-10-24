import gql from 'graphql-tag'

export const adminCreateContributionMessage = gql`
  mutation ($contributionId: Float!, $message: String!) {
    adminCreateContributionMessage(contributionId: $contributionId, message: $message) {
      id
      message
      createdAt
      updatedAt
      type
      userFirstName
      userLastName
    }
  }
`
