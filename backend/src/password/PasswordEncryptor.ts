import { User } from 'database'

import { getUserCryptographicSalt, SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export const encryptPassword = async (dbUser: User, password: string): Promise<bigint> => {
  const salt = getUserCryptographicSalt(dbUser)
  return SecretKeyCryptographyCreateKey(salt, password)
}

export const verifyPassword = async (dbUser: User, password: string): Promise<boolean> => {
  const encryptedPassword = await encryptPassword(dbUser, password)
  return dbUser.password.toString() === encryptedPassword.toString()
}
