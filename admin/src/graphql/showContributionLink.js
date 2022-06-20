import gql from 'graphql-tag'

export const showContributionLink = gql`
  query ($id: Int!) {
    showContributionLink {
      id
      validFrom
      validTo
      name
      memo
      amount
      cycle
      maxPerCycle
      maxAmountPerMonth
      code
    }
  }
`
