import gql from 'graphql-tag'

export const creationTransactionList = gql`
  query ($currentPage: Int = 1, $pageSize: Int = 25, $order: Order = DESC, $userId: Int!) {
    creationTransactionList(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      userId: $userId
    ) {
      id
      amount
      balanceDate
      creationDate
      memo
      linkedUser {
        firstName
        lastName
      }
    }
  }
`
