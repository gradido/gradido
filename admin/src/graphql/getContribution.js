import gql from 'graphql-tag'

export const getContribution = gql`
  query ($id: Int!) {
    contribution(id: $id) {
      id
      firstName
      lastName
      amount
      memo
      createdAt
      contributionDate
      confirmedAt
      confirmedBy
      updatedAt
      updatedBy
      status
      messagesCount
      deniedAt
      deniedBy
      deletedAt
      deletedBy
      moderatorId
      userId
    }
  }
`