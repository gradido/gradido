import gql from 'graphql-tag'

export const adminCreateContributionMessage = gql`
  mutation (
    $contributionId: Int!
    $message: String!
    $messageType: ContributionMessageType
    $resubmissionAt: String
  ) {
    adminCreateContributionMessage(
      contributionId: $contributionId
      message: $message
      messageType: $messageType
      resubmissionAt: $resubmissionAt
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
