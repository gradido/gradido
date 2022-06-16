import gql from 'graphql-tag'

export const adminUpdateContribution = gql`
  mutation ($id: Int!, $email: String!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    adminUpdateContribution(
      id: $id
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
    ) {
      amount
      date
      memo
      creation
    }
  }
`
