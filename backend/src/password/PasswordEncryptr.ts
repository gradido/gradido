import { User } from '@entity/User'
import { logger } from '@test/testSetup'
import { getBasicCryptographicKey, SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export const encryptPassword = (dbUser: User, password: string): bigint => {
  const basicKey = getBasicCryptographicKey(dbUser)
  if (!basicKey) logger.error('Password not set for user ' + dbUser.id)
  else {
    const keyBuffer = SecretKeyCryptographyCreateKey(basicKey, password) // return short and long hash
    const passwordHash = keyBuffer[0].readBigUInt64LE()
    return passwordHash
  }

  throw new Error('Password not set for user ' + dbUser.id) // user has no password
}

export const verifyPassword = (dbUser: User, password: string): boolean => {
  const basicKey = getBasicCryptographicKey(dbUser)
  if (!basicKey) logger.error('Password not set for user ' + dbUser.id)
  else {
    if (BigInt(password) !== encryptPassword(dbUser, dbUser.password.toString())) {
      return false
    }
    return true
  }

  throw new Error('Password not set for user ' + dbUser.id) // user has no password
}
