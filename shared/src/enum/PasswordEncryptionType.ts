// not compatible with typescript 4
// import { enum as zEnum } from 'zod/v4-mini'

export enum PasswordEncryptionType {
  NO_PASSWORD = 0,
  EMAIL = 1,
  GRADIDO_ID = 2,
}

// export const PasswordEncryptionTypeSchema = zEnum(PasswordEncryptionType)
