import gql from 'graphql-tag'

export const subscribeNewsletter = gql`
  mutation {
    subscribeNewsletter
  }
`

export const unsubscribeNewsletter = gql`
  mutation {
    unsubscribeNewsletter
  }
`

export const setPassword = gql`
  mutation ($code: String!, $password: String!) {
    setPassword(code: $code, password: $password)
  }
`

export const forgotPassword = gql`
  mutation ($email: String!) {
    forgotPassword(email: $email)
  }
`

export const updateUserInfos = gql`
  mutation (
    $firstName: String
    $lastName: String
    $alias: String
    $password: String
    $passwordNew: String
    $locale: String
    $hideAmountGDD: Boolean
    $hideAmountGDT: Boolean
    $gmsAllowed: Boolean
    $humhubAllowed: Boolean
    $gmsPublishName: PublishNameType
    $humhubPublishName: PublishNameType
    $gmsLocation: Location
    $gmsPublishLocation: GmsPublishLocationType
  ) {
    updateUserInfos(
      firstName: $firstName
      lastName: $lastName
      alias: $alias
      password: $password
      passwordNew: $passwordNew
      language: $locale
      hideAmountGDD: $hideAmountGDD
      hideAmountGDT: $hideAmountGDT
      gmsAllowed: $gmsAllowed
      humhubAllowed: $humhubAllowed
      gmsPublishName: $gmsPublishName
      humhubPublishName: $humhubPublishName
      gmsLocation: $gmsLocation
      gmsPublishLocation: $gmsPublishLocation
    )
  }
`

export const createUser = gql`
  mutation (
    $firstName: String!
    $lastName: String!
    $email: String!
    $language: String!
    $publisherId: Int
    $redeemCode: String
  ) {
    createUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      language: $language
      publisherId: $publisherId
      redeemCode: $redeemCode
    ) {
      id
    }
  }
`

export const sendCoins = gql`
  mutation (
    $recipientCommunityIdentifier: String!
    $recipientIdentifier: String!
    $amount: Decimal!
    $memo: String!
  ) {
    sendCoins(
      recipientCommunityIdentifier: $recipientCommunityIdentifier
      recipientIdentifier: $recipientIdentifier
      amount: $amount
      memo: $memo
    )
  }
`

export const createTransactionLink = gql`
  mutation ($amount: Decimal!, $memo: String!) {
    createTransactionLink(amount: $amount, memo: $memo) {
      link
      amount
      memo
      validUntil
    }
  }
`

export const deleteTransactionLink = gql`
  mutation ($id: Int!) {
    deleteTransactionLink(id: $id)
  }
`

export const redeemTransactionLink = gql`
  mutation ($code: String!) {
    redeemTransactionLink(code: $code)
  }
`

export const createContribution = gql`
  mutation ($creationDate: String!, $memo: String!, $amount: Decimal!) {
    createContribution(creationDate: $creationDate, memo: $memo, amount: $amount) {
      amount
      memo
    }
  }
`

export const updateContribution = gql`
  mutation ($contributionId: Int!, $amount: Decimal!, $memo: String!, $creationDate: String!) {
    updateContribution(
      contributionId: $contributionId
      amount: $amount
      memo: $memo
      creationDate: $creationDate
    ) {
      id
      amount
      memo
    }
  }
`

export const deleteContribution = gql`
  mutation ($id: Int!) {
    deleteContribution(id: $id)
  }
`

export const createContributionMessage = gql`
  mutation ($contributionId: Int!, $message: String!) {
    createContributionMessage(contributionId: $contributionId, message: $message) {
      id
      message
      createdAt
      updatedAt
      type
      userFirstName
      userLastName
    }
  }
`

export const login = gql`
  mutation ($email: String!, $password: String!, $publisherId: Int) {
    login(email: $email, password: $password, publisherId: $publisherId) {
      gradidoID
      alias
      firstName
      lastName
      language
      klickTipp {
        newsletterState
      }
      gmsAllowed
      humhubAllowed
      gmsPublishName
      humhubPublishName
      gmsPublishLocation
      hasElopage
      publisherId
      roles
      hideAmountGDD
      hideAmountGDT
    }
  }
`

export const logout = gql`
  mutation {
    logout
  }
`
