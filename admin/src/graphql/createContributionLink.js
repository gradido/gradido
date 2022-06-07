import gql from 'graphql-tag'

export const createContributionLink = gql`
  mutation (
    $startDate: String!
    $endDate: String!
    $name: String!
    $amount: Decimal!
    $memo: String!
    $cycle: String
    $repetition: String
    $maxAmount: Decimal
  ) {
    createContributionLink(
      startDate: $startDate
      endDate: $endDate
      name: $name
      amount: $amount
      memo: $memo
      cycle: $cycle
      repetition: $repetition
      maxAmount: $maxAmount
    ) {
      link
    }
  }
`
