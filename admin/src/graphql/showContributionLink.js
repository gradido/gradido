import gql from 'graphql-tag'

export const showContributionLink = gql`
  query ($id: Int!) {
    showContributionLink {
      id
      startDate
      endDate
      name
      memo
      amount
      cycle
      repetition
      maxAmount
      code
    }
  }
`
