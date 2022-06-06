import gql from 'graphql-tag'

export const showAutomaticCreation = gql`
  query ($id: Int!) {
    showAutomaticCreation {
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
