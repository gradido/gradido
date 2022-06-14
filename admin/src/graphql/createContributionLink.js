import gql from 'graphql-tag'

export const createContributionLink = gql`
  mutation (
    $validFrom: String!
    $validTo: String!
    $name: String!
    $amount: Decimal!
    $memo: String!
    $cycle: String!
    $maxPerCycle: Int! = 1
    $maxAmountPerMonth: Decimal
  ) {
    createContributionLink(
      validFrom: $validFrom
      validTo: $validTo
      name: $name
      amount: $amount
      memo: $memo
      cycle: $cycle
      maxPerCycle: $maxPerCycle
      maxAmountPerMonth: $maxAmountPerMonth
    ) {
      link
    }
  }
`
