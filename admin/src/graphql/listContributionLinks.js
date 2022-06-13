import gql from 'graphql-tag'

export const listContributionLinks = gql`
  query {
    listContributionLinks {
      id
      startDate
      endDate
      name
      memo
      amount
      cycle
      repetition
      maxAmount
      link
    }
  }
`
