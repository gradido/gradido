// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

export const adminCreateContributionMessage = gql`
  mutation (
    $contributionId: Int!
    $message: String!
    $messageType: ContributionMessageType
    $resubmissionAt: String
    $aiModel: String
  ) {
    adminCreateContributionMessage(
      contributionId: $contributionId
      message: $message
      messageType: $messageType
      resubmissionAt: $resubmissionAt
      aiModel: $aiModel
    ) {
      id
      message
      createdAt
      updatedAt
      type
      userAlias
    }
  }
`
