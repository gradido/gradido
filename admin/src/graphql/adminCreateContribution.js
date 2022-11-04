import gql from 'graphql-tag'

export const adminCreateContribution = gql`
  mutation ($email: String!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    adminCreateContribution(
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
    )
  }
`
