import gql from 'graphql-tag'

export const updatePendingCreation = gql`
  mutation ($id: Int!, $email: String!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    updatePendingCreation(
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
