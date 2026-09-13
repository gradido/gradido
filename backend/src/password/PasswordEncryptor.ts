import { delay } from 'core'
import { DbUser, User } from 'database'

import { getUserCryptographicSalt, SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export const encryptPassword = async (dbUser: User | DbUser, password: string): Promise<bigint> => {
  const salt = getUserCryptographicSalt(dbUser)
  return SecretKeyCryptographyCreateKey(salt, password)
}

export const verifyPassword = async (dbUser: User | DbUser, password: string): Promise<boolean> => {
  const encryptedPassword = await encryptPassword(dbUser, password)
  if (!dbUser.password) {
    return false
  }
  return dbUser.password.toString() === encryptedPassword.toString()
}

// for login function which should return even on error after the same time,
// at it would return with full passwort verify check, without blocking cpu time for this
// to prevent changing the login function into a account oracel
// todo: calculate time on startup for the actual hardware rather than assuming the same value for every server configuration
export function fakeVerifyPassword(): Promise<void> {
  return delay(650 + Math.floor(Math.random() * 101) - 50)
}
