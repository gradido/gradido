import { registerEnumType } from 'type-graphql'

export enum OptInType {
  EMAIL_OPT_IN_REGISTER = 1,
  EMAIL_OPT_IN_RESET_PASSWORD = 2,
  // A second contact row waiting for the member to confirm a NEW address. Its code must
  // not be accepted by the password paths (`setPassword`, `queryOptIn`) - they filter on
  // this value - because confirming an address and logging in are different things.
  EMAIL_OPT_IN_CHANGE = 3,
}

registerEnumType(OptInType, {
  name: 'OptInType', // this one is mandatory
  description: 'Type of the email optin', // this one is optional
})
