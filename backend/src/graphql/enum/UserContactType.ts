import { registerEnumType } from 'type-graphql'

export enum UserContactType {
  USER_CONTACT_EMAIL = 'EMAIL',
  USER_CONTACT_PHONE = 'PHONE',
}

registerEnumType(UserContactType, {
  name: 'UserContactType', // this one is mandatory
  description: 'Type of the user contact', // this one is optional
})
