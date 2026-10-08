import * as v from 'valibot'

export enum PasswordEncryptionType {
  NO_PASSWORD = 0,
  EMAIL = 1,
  GRADIDO_ID = 2,
}

export const PasswordEncryptionTypeSchema = v.enum(PasswordEncryptionType)
