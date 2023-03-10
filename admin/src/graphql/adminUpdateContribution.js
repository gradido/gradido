import gql from 'graphql-tag'

export const adminUpdateContribution = gql`
  mutation ($id: Int!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    adminUpdateContribution(id: $id, amount: $amount, memo: $memo, creationDate: $creationDate) {
      amount
      date
      memo
    }
  }
`
