import gql from 'graphql-tag'

export const updateContributionLink = gql`
  mutation (
    $amount: Decimal!
    $name: String!
    $memo: String!
    $cycle: String!
    $validFrom: String
    $validTo: String
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
      cycle
      maxPerCycle
    }
  }
`
