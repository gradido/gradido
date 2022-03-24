import { registerEnumType } from 'type-graphql'

export enum OptInType {
  EMAIL_OPT_IN_REGISTER = 1,
  EMAIL_OPT_IN_RESET_PASSWORD = 2,
}

registerEnumType(OptInType, {
  name: 'OptInType', // this one is mandatory
  description: 'Type of the email optin', // this one is optional
})
