import gql from 'graphql-tag'

export const updateContributionLink = gql`
  mutation (
    $amount: Decimal!
    $name: String!
    $memo: String!
    $cycle: String!
    $validFrom: String
    $validTo: String
    $maxAmountPerMonth: Decimal
    $maxPerCycle: Int! = 1
    $id: Int!
  ) {
    updateContributionLink(
      amount: $amount
      name: $name
      memo: $memo
      cycle: $cycle
      validFrom: $validFrom
      validTo: $validTo
      maxAmountPerMonth: $maxAmountPerMonth
      maxPerCycle: $maxPerCycle
      id: $id
    ) {
      id
      amount
      name
      memo
      code
      link
      createdAt
      validFrom
      validTo
      maxAmountPerMonth
      cycle
      maxPerCycle
    }
  }
`
