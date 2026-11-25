// AI-GENERATED — not an architecture reference
import gql from 'graphql-tag'

// The member signed in, as `data/Member.schema.ts` reads them: asked the same way by the
// sign-in and by a page loaded anew.
const member = gql`
  fragment member on User {
    gradidoID
    communityUuid
    alias
    firstName
    lastName
    language
    role
    createdAt
    emailChecked
    emailContact {
      email
    }
    klickTipp {
      newsletterState
    }
    avatar
    avatarVisibleToMembers
    creationAllowed
    firstCreationStatus
    transfersInChat
    gmsAllowed
    gmsPublishLocation
    humhubAllowed
    userLocation
    hideAmountGDD
    hideAmountGDT
  }
`

export const verifyLogin = gql`
  query {
    verifyLogin {
      ...member
    }
  }
  ${member}
`

export const login = gql`
  mutation ($email: String!, $password: String!, $project: String) {
    login(email: $email, password: $password, project: $project) {
      ...member
    }
  }
  ${member}
`
