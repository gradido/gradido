import { User } from '@entity/User'
// import { logger } from '@test/testSetup' getting error "jest is not defined"
import { getUserCryptographicSalt, SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export const encryptPassword = (dbUser: User, password: string): bigint => {
  const salt = getUserCryptographicSalt(dbUser)
  const keyBuffer = SecretKeyCryptographyCreateKey(salt, password) // return short and long hash
  const passwordHash = keyBuffer[0].readBigUInt64LE()
  return passwordHash
}

export const verifyPassword = (dbUser: User, password: string): boolean => {
  return dbUser.password.toString() === encryptPassword(dbUser, password).toString()
}
