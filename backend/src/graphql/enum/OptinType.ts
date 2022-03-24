import { registerEnumType } from 'type-graphql'

export enum OptinType {
  EMAIL_OPT_IN_REGISTER = 1,
  EMAIL_OPT_IN_RESET_PASSWORD = 2,
}

registerEnumType(OptinType, {
  name: 'OptinType', // this one is mandatory
  description: 'Type of the email optin', // this one is optional
})
