import gql from 'graphql-tag'

export const listContributionLinks = gql`
  query {
    listContributionLinks {
      id
      validFrom
      validTo
      name
      memo
      amount
      cycle
      maxPerCycle
      maxAmountPerMonth
      link
    }
  }
`
