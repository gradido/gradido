import gql from 'graphql-tag'

export const listTransactionLinks = gql`
query($currentPage: Int = 1, $pageSize: Int = 5) {
  listTransactionLinks(currentPage: $currentPage, pageSize: $pageSize) {
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
