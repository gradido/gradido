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

export const requestEmailChange = gql`
  mutation ($email: String!, $password: String!) {
    requestEmailChange(email: $email, password: $password) {
      email
      requestedAt
      resendAllowedAt
    }
  }
`

export const resendEmailChange = gql`
  mutation {
    resendEmailChange {
      email
      requestedAt
      resendAllowedAt
    }
  }
`

export const cancelEmailChange = gql`
  mutation {
    cancelEmailChange
  }
`

export const confirmEmailChange = gql`
  mutation ($code: String!) {
    confirmEmailChange(code: $code)
  }
`

export const revokeEmailChange = gql`
  mutation ($vetoCode: String!) {
    revokeEmailChange(vetoCode: $vetoCode)
  }
`

export const adoptAlias = gql`
  mutation {
    adoptAlias
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
    $avatarVisibleToMembers: Boolean
    $gmsPublishName: PublishNameType
    $humhubPublishName: PublishNameType
    $gmsLocation: Location
    $gmsPublishLocation: GmsPublishLocationType
    $aboutMe: String
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
      avatarVisibleToMembers: $avatarVisibleToMembers
      gmsPublishName: $gmsPublishName
      humhubPublishName: $humhubPublishName
      gmsLocation: $gmsLocation
      gmsPublishLocation: $gmsPublishLocation
      aboutMe: $aboutMe
    )
  }
`

export const createMatchingEntry = gql`
  mutation ($input: MatchingEntryInput!) {
    createMatchingEntry(input: $input) {
      uuid
    }
  }
`

export const updateMatchingEntry = gql`
  mutation ($uuid: String!, $input: MatchingEntryInput!) {
    updateMatchingEntry(uuid: $uuid, input: $input) {
      uuid
    }
  }
`

export const setMatchingEntryActive = gql`
  mutation ($uuid: String!, $active: Boolean!) {
    setMatchingEntryActive(uuid: $uuid, active: $active) {
      uuid
      active
    }
  }
`

export const deleteMatchingEntry = gql`
  mutation ($uuid: String!) {
    deleteMatchingEntry(uuid: $uuid)
  }
`

export const authenticateHumhubAutoLogin = gql`
  mutation {
    authenticateHumhubAutoLogin
  }
`
export const authenticateHumhubAutoLoginProject = gql`
  mutation ($project: String!) {
    authenticateHumhubAutoLogin(project: $project)
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
    $project: String
  ) {
    createUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      language: $language
      publisherId: $publisherId
      redeemCode: $redeemCode
      project: $project
    ) {
      id
    }
  }
`

export const sendCoins = gql`
  mutation (
    $recipientCommunityIdentifier: String!
    $recipientIdentifier: String!
    $amount: GradidoUnit!
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

export const sendEmail = gql`
  mutation (
    $recipientCommunityIdentifier: String!
    $recipientIdentifier: String!
    $subject: String!
    $memo: String!
  ) {
    sendEmail(
      recipientCommunityIdentifier: $recipientCommunityIdentifier
      recipientIdentifier: $recipientIdentifier
      subject: $subject
      memo: $memo
    )
  }
`

export const createTransactionLink = gql`
  mutation ($amount: GradidoUnit!, $memo: String!) {
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
  mutation ($email: String!, $password: String!, $publisherId: Int, $project: String) {
    login(email: $email, password: $password, publisherId: $publisherId, project: $project) {
      gradidoID
      alias
      emailChecked
      createdAt
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
      userLocation
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

export const createRedeemJwtMutation = gql`
  mutation (
    $gradidoId: String!
    $senderCommunityUuid: String!
    $senderCommunityName: String!
    $recipientCommunityUuid: String!
    $code: String!
    $amount: String!
    $memo: String!
    $firstName: String
    $alias: String
    $validUntil: String
  ) {
    createRedeemJwt(
      gradidoId: $gradidoId
      senderCommunityUuid: $senderCommunityUuid
      senderCommunityName: $senderCommunityName
      recipientCommunityUuid: $recipientCommunityUuid
      code: $code
      amount: $amount
      memo: $memo
      firstName: $firstName
      alias: $alias
      validUntil: $validUntil
    )
  }
`

export const disburseTransactionLink = gql`
  mutation (
    $senderCommunityUuid: String!
    $senderGradidoId: String!
    $recipientCommunityUuid: String!
    $recipientCommunityName: String!
    $recipientGradidoId: String!
    $recipientFirstName: String!
    $code: String!
    $amount: String!
    $memo: String!
    $validUntil: String
    $recipientAlias: String
  ) {
    disburseTransactionLink(
      senderCommunityUuid: $senderCommunityUuid
      senderGradidoId: $senderGradidoId
      recipientCommunityUuid: $recipientCommunityUuid
      recipientCommunityName: $recipientCommunityName
      recipientGradidoId: $recipientGradidoId
      recipientFirstName: $recipientFirstName
      code: $code
      amount: $amount
      memo: $memo
      validUntil: $validUntil
      recipientAlias: $recipientAlias
    )
  }
`

// The member's own profile picture, both renditions from one crop. Base64 without a data
// URI prefix; the browser has already cropped and stepped the quality down until each fit
// its budget -- 128x128 for everyday use, 512x512 for the printed card.
//
// Both in one mutation on purpose: they describe the same square, and a half-applied
// change would show the member two different pictures depending on where they look.
export const setUserAvatar = gql`
  mutation ($avatarSmall: String!, $avatarFull: String!) {
    setUserAvatar(avatarSmall: $avatarSmall, avatarFull: $avatarFull)
  }
`

export const removeUserAvatar = gql`
  mutation {
    removeUserAvatar
  }
`

export const completeAssistedRegistration = gql`
  mutation ($assistCode: String!, $email: String!, $password: String!) {
    completeAssistedRegistration(assistCode: $assistCode, email: $email, password: $password) {
      redeemCode
    }
  }
`

export const confirmEmailMutation = gql`
  mutation ($code: String!) {
    confirmEmail(code: $code)
  }
`

export const resendConfirmationEmail = gql`
  mutation {
    resendConfirmationEmail
  }
`
