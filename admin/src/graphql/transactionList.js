import gql from 'graphql-tag'

export const transactionList = gql`
  query (
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $onlyCreations: Boolean = false
    $userId: Int = null
  ) {
    transactionList(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      onlyCreations: $onlyCreations
      userId: $userId
    ) {
      balanceGDT
      count
      balance
      decayStartBlock
      transactions {
        id
        typeId
        amount
        balanceDate
        memo
        linkedUser {
          firstName
          lastName
        }
        decay {
          decay
          start
          end
          duration
        }
      }
    }
  }
`
