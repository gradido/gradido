import gql from 'graphql-tag'

export const login = gql`
  query($email: String!, $password: String!, $publisherId: Int) {
    login(email: $email, password: $password, publisherId: $publisherId) {
      email
      firstName
      lastName
      language
      coinanimation
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      isAdmin
    }
  }
`

export const verifyLogin = gql`
  query {
    verifyLogin {
      email
      firstName
      lastName
      language
      coinanimation
      klickTipp {
        newsletterState
      }
      hasElopage
      publisherId
      isAdmin
    }
  }
`

export const logout = gql`
  query {
    logout
  }
`

export const transactionsQuery = gql`
  query(
    $currentPage: Int = 1
    $pageSize: Int = 25
    $order: Order = DESC
    $onlyCreations: Boolean = false
  ) {
    transactionList(
      currentPage: $currentPage
      pageSize: $pageSize
      order: $order
      onlyCreations: $onlyCreations
    ) {
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

export const sendResetPasswordEmail = gql`
  query($email: String!) {
    sendResetPasswordEmail(email: $email)
  }
`

export const listGDTEntriesQuery = gql`
  query($currentPage: Int!, $pageSize: Int!) {
    listGDTEntries(currentPage: $currentPage, pageSize: $pageSize) {
      count
      gdtEntries {
        id
        amount
        date
        comment
        gdtEntryType
        factor
        gdt
      }
      gdtSum
    }
  }
`

export const communityInfo = gql`
  query {
    getCommunityInfo {
      name
      description
      registerUrl
      url
    }
  }
`

export const communities = gql`
  query {
    communities {
      id
      name
      url
      description
      registerUrl
    }
  }
`
