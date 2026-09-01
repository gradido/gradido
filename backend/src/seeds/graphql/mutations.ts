import { gql } from 'graphql-tag'

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

export const confirmEmailChange = gql`
  mutation ($code: String!) {
    confirmEmailChange(code: $code)
  }
`

export const completeAssistedRegistration = gql`
  mutation ($assistCode: String!, $email: String!, $password: String!) {
    completeAssistedRegistration(assistCode: $assistCode, email: $email, password: $password) {
      redeemCode
    }
  }
`

export const confirmEmail = gql`
  mutation ($code: String!) {
    confirmEmail(code: $code)
  }
`

export const resendConfirmationEmail = gql`
  mutation {
    resendConfirmationEmail
  }
`

export const revokeEmailChange = gql`
  mutation ($vetoCode: String!) {
    revokeEmailChange(vetoCode: $vetoCode)
  }
`

export const cancelEmailChange = gql`
  mutation {
    cancelEmailChange
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

export const adminReplaceUnconfirmedEmail = gql`
  mutation ($userId: Int!, $email: String!) {
    adminReplaceUnconfirmedEmail(userId: $userId, email: $email)
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
    $avatarVisibleToMembers: Boolean
    $gmsPublishName: PublishNameType
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
      avatarVisibleToMembers: $avatarVisibleToMembers
      gmsPublishName: $gmsPublishName
      gmsLocation: $gmsLocation
      gmsPublishLocation: $gmsPublishLocation
      aboutMe: $aboutMe
    )
  }
`

export const createUser = gql`
  mutation (
    $alias: String
    $firstName: String!
    $lastName: String!
    $email: String!
    $language: String!
    $publisherId: Int
    $redeemCode: String
  ) {
    createUser(
      alias: $alias
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

export const sendActivationEmail = gql`
  mutation ($email: String!) {
    sendActivationEmail(email: $email)
  }
`

/*
export const sendCoins = gql`
  mutation ($identifier: String!, $amount: GradidoUnit!, $memo: String!, $communityIdentifier: String) {
    sendCoins(
      identifier: $identifier
      amount: $amount
      memo: $memo
      communityIdentifier: $communityIdentifier
    )
  }
`
*/
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

export const createTransactionLink = gql`
  mutation ($amount: GradidoUnit!, $memo: String!) {
    createTransactionLink(amount: $amount, memo: $memo) {
      id
      code
    }
  }
`

export const deleteTransactionLink = gql`
  mutation ($id: Int!) {
    deleteTransactionLink(id: $id)
  }
`

// from admin interface

export const adminCreateContribution = gql`
  mutation ($email: String!, $amount: GradidoUnit!, $memo: String!, $creationDate: String!) {
    adminCreateContribution(
      email: $email
      amount: $amount
      memo: $memo
      creationDate: $creationDate
    )
  }
`

export const assignContributionCreationGroups = gql`
  mutation ($contributionId: Int!, $tags: [String!]!) {
    assignContributionCreationGroups(contributionId: $contributionId, tags: $tags)
  }
`

export const confirmContribution = gql`
  mutation ($id: Int!) {
    confirmContribution(id: $id)
  }
`

export const setUserRole = gql`
  mutation ($userId: Int!, $role: RoleNames) {
    setUserRole(userId: $userId, role: $role)
  }
`

export const deleteUser = gql`
  mutation ($userId: Int!) {
    deleteUser(userId: $userId)
  }
`

export const unDeleteUser = gql`
  mutation ($userId: Int!) {
    unDeleteUser(userId: $userId)
  }
`

export const adminUpdateContribution = gql`
  mutation ($id: Int!, $amount: GradidoUnit!, $memo: String!, $creationDate: String!) {
    adminUpdateContribution(id: $id, amount: $amount, memo: $memo, creationDate: $creationDate) {
      amount
      date
      memo
    }
  }
`

export const adminDeleteContribution = gql`
  mutation ($id: Int!) {
    adminDeleteContribution(id: $id)
  }
`

export const createContributionLink = gql`
  mutation (
    $amount: GradidoUnit!
    $name: String!
    $memo: String!
    $cycle: String!
    $validFrom: String
    $validTo: String
    $maxAmountPerMonth: GradidoUnit
    $maxPerCycle: Int! = 1
  ) {
    createContributionLink(
      amount: $amount
      name: $name
      memo: $memo
      cycle: $cycle
      validFrom: $validFrom
      validTo: $validTo
      maxAmountPerMonth: $maxAmountPerMonth
      maxPerCycle: $maxPerCycle
    ) {
      id
      amount
      name
      memo
      code
      link
      createdAt
      validFrom
      validTo
      maxAmountPerMonth
      cycle
      maxPerCycle
    }
  }
`

export const updateContributionLink = gql`
  mutation (
    $amount: GradidoUnit!
    $name: String!
    $memo: String!
    $cycle: String!
    $validFrom: String
    $validTo: String
    $maxAmountPerMonth: GradidoUnit
    $maxPerCycle: Int! = 1
    $id: Int!
  ) {
    updateContributionLink(
      amount: $amount
      name: $name
      memo: $memo
      cycle: $cycle
      validFrom: $validFrom
      validTo: $validTo
      maxAmountPerMonth: $maxAmountPerMonth
      maxPerCycle: $maxPerCycle
      id: $id
    ) {
      id
      amount
      name
      memo
      code
      link
      createdAt
      validFrom
      validTo
      maxAmountPerMonth
      cycle
      maxPerCycle
    }
  }
`

export const deleteContributionLink = gql`
  mutation ($id: Int!) {
    deleteContributionLink(id: $id)
  }
`

export const createContribution = gql`
  mutation (
    $amount: GradidoUnit!
    $memo: String!
    $contributionDate: String!
    $creationGroups: [String!]
  ) {
    createContribution(
      amount: $amount
      memo: $memo
      contributionDate: $contributionDate
      creationGroups: $creationGroups
    ) {
      id
      amount
      memo
      userId
    }
  }
`

export const updateContribution = gql`
  mutation ($contributionId: Int!, $amount: GradidoUnit!, $memo: String!, $contributionDate: String!) {
    updateContribution(
      contributionId: $contributionId
      amount: $amount
      memo: $memo
      contributionDate: $contributionDate
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

export const denyContribution = gql`
  mutation ($id: Int!) {
    denyContribution(id: $id)
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
      userAlias
      userAvatarColorIndex
    }
  }
`

export const adminCreateContributionMessage = gql`
  mutation ($contributionId: Int!, $message: String!, $messageType: ContributionMessageType) {
    adminCreateContributionMessage(
      contributionId: $contributionId
      message: $message
      messageType: $messageType
    ) {
      id
      message
      createdAt
      updatedAt
      type
      userAlias
      userAvatarColorIndex
    }
  }
`

export const redeemTransactionLink = gql`
  mutation ($code: String!) {
    redeemTransactionLink(code: $code)
  }
`

export const login = gql`
  mutation ($email: String!, $password: String!, $publisherId: Int) {
    login(email: $email, password: $password, publisherId: $publisherId) {
      gradidoID
      alias
      emailChecked
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

export const updateHomeCommunityQuery = gql`
  mutation ($uuid: String!, $gmsApiKey: String!) {
    updateHomeCommunity(uuid: $uuid, gmsApiKey: $gmsApiKey) {
      foreign
      name
      description
      url
      creationDate
      uuid
      authenticatedAt
      gmsApiKey
    }
  }
`

export const createMatchingEntry = gql`
  mutation ($input: MatchingEntryInput!) {
    createMatchingEntry(input: $input) {
      uuid
      matchingType
      summary
      details
      remote
      active
    }
  }
`

export const updateMatchingEntry = gql`
  mutation ($uuid: String!, $input: MatchingEntryInput!) {
    updateMatchingEntry(uuid: $uuid, input: $input) {
      uuid
      matchingType
      summary
      details
      remote
      active
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

// --- the thank you card, from both sides of the counter ---

export const setThankYouCardSettings = gql`
  mutation ($pin: String!, $maxPerPayment: GradidoUnit!, $maxPerDay: GradidoUnit!) {
    setThankYouCardSettings(pin: $pin, maxPerPayment: $maxPerPayment, maxPerDay: $maxPerDay) {
      maxPerPayment
      maxPerDay
    }
  }
`

export const createThankYouCard = gql`
  mutation ($label: String!) {
    createThankYouCard(label: $label) {
      id
      code
      label
    }
  }
`

export const createThankYouCardPayment = gql`
  mutation ($code: String!, $amount: GradidoUnit!, $memo: String!) {
    createThankYouCardPayment(code: $code, amount: $amount, memo: $memo) {
      id
    }
  }
`

export const confirmThankYouCardPayment = gql`
  mutation ($paymentId: Int!, $pin: String!) {
    confirmThankYouCardPayment(paymentId: $paymentId, pin: $pin) {
      status
      attemptsLeft
      payerName
    }
  }
`

// The two halves of the Crea settings page. Both are admin-only: the model applies to
// every moderator at once, and the keying switch decides whether a language model is
// paid per matching entry.
export const setCreaSettings = gql`
  mutation ($input: CreaSettingsInput!) {
    setCreaSettings(input: $input) {
      model
      effort
      defaultModel
      fastMode
      matchingKeyingActive
    }
  }
`

export const setCreaMatchingKeying = gql`
  mutation ($active: Boolean!) {
    setCreaMatchingKeying(active: $active)
  }
`
