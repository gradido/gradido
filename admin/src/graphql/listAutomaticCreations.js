import gql from 'graphql-tag'

export const listAutomaticCreations = gql`
  query {
    listAutomaticCreations {
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
