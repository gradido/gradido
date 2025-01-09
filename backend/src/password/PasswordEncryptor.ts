import { User } from '@entity/User'

// import { logger } from '@test/testSetup' getting error "jest is not defined"
import { getUserCryptographicSalt, SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export const encryptPassword = async (dbUser: User, password: string): Promise<bigint> => {
  const salt = getUserCryptographicSalt(dbUser)
  const keyBuffer: Uint8Array[] = await SecretKeyCryptographyCreateKey(salt, password) // returns Uint8Array[short hash, long hash]
  const passwordHash = Buffer.from(keyBuffer[0]).readBigUInt64LE()
  return passwordHash
}

export const verifyPassword = async (dbUser: User, password: string): Promise<boolean> => {
  const encryptedPassword = await encryptPassword(dbUser, password)
  return dbUser.password.toString() === encryptedPassword.toString()
}
