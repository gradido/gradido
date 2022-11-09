import { registerEnumType } from 'type-graphql'

export enum PasswordEncryptionType {
  EMAIL = 0,
  ONE_TIME = 1,
  GRADIDO_ID = 2,
}

registerEnumType(PasswordEncryptionType, {
  name: 'PasswordEncryptionType', // this one is mandatory
  description: 'Type of the password encryption', // this one is optional
})
