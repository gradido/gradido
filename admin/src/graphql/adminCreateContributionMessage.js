import gql from 'graphql-tag'

export const adminCreateContributionMessage = gql`
  mutation ($contributionId: Int!, $message: String!, $messageType: ContributionMessageType) {
    adminCreateContributionMessage(
      contributionId: $contributionId
      message: $message
      messageType: $messageType
    ) {
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
