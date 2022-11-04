import { registerEnumType } from 'type-graphql'

export enum PasswordEncryptionType {
  ONE_TIME = 0,
  EMAIL = 1,
  GRADIDO_ID = 2,
}

registerEnumType(PasswordEncryptionType, {
  name: 'PasswordEncryptionType', // this one is mandatory
  description: 'Type of the passwort encryption', // this one is optional
})
