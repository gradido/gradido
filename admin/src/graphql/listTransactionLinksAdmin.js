import gql from 'graphql-tag'

export const listTransactionLinksAdmin = gql`
  query ($currentPage: Int = 1, $pageSize: Int = 5, $userId: Int!) {
    listTransactionLinksAdmin(currentPage: $currentPage, pageSize: $pageSize, userId: $userId) {
      id
      amount
      holdAvailableAmount
      memo
      code
      createdAt
      validUntil
      redeemedAt
    }
  }
`
