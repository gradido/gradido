import { User } from '@entity/User'

// import { logger } from '@test/testSetup' getting error "jest is not defined"
import { SecretKeyCryptographyCreateKey, getUserCryptographicSalt } from './EncryptorUtils'

export const encryptPassword = async (dbUser: User, password: string): Promise<bigint> => {
  const salt = getUserCryptographicSalt(dbUser)
  return SecretKeyCryptographyCreateKey(salt, password)
}

export const verifyPassword = async (dbUser: User, password: string): Promise<boolean> => {
  const encryptedPassword = await encryptPassword(dbUser, password)
  return dbUser.password.toString() === encryptedPassword.toString()
}
