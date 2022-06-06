import gql from 'graphql-tag'

export const createAutomaticCreation = gql`
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
    createAutomaticCreation(
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
