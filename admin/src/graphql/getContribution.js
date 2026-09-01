import gql from 'graphql-tag'

// The shape of ONE row of `adminListContributions`, because that is what the caller
// does with the answer: `items.value[index] = contribution` replaces a list row.
// The user's name sits under `user` since real names left `Contribution` — a flat
// `firstName` here made every reload fail validation and toast the raw error.
export const getContribution = gql`
  query ($id: Int!) {
    contribution(id: $id) {
      id
      user {
        emailContact {
          email
        }
        id
        firstName
        lastName
        alias
        salutation
        publicName
        userIdentifier
        createdAt
      }
      amount
      memo
      createdAt
      contributionDate
      confirmedAt
      confirmedBy
      updatedAt
      updatedBy
      updatedByUserName
      closedAt
      closedBy
      closedByUserName
      contributionStatus
      creationGroups {
        tag
        name
      }
      messagesCount
      deniedAt
      deniedBy
      deletedAt
      deletedBy
      moderatorId
      moderatorUserName
      userId
      resubmissionAt
    }
  }
`
