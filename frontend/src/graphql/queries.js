import gql from 'graphql-tag'

export const login = gql`
  query($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      sessionId
      user {
        email
        firstName
        lastName
        language
        username
        description
      }
    }
  }
`
export const logout = gql`
  query($sessionId: Float!) {
    logout(sessionId: $sessionId)
  }
`

export const transactionsQuery = gql`
  query($sessionId: Float!, $firstPage: Int = 1, $items: Int = 25, $order: String = "DESC") {
    transactionList(sessionId: $sessionId, firstPage: $firstPage, items: $items, order: $order) {
      gdtSum
      count
      balance
      decay
      decayDate
      transactions {
        type
        balance
        decayStart
        decayEnd
        decayDuration
        memo
        transactionId
        name
        email
        date
        decay {
          balance
          decayStart
          decayEnd
          decayDuration
          decayStartBlock
        }
      }
    }
  }
`
