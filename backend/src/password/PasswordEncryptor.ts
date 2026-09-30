import { delay } from 'core'
import { DbUser, User } from 'database'
import { ResourceExhausted, Result } from 'shared'

import { getUserCryptographicSalt, SecretKeyCryptographyCreateKey } from './EncryptorUtils'
import { PasswordDataInput } from './passwordData.schema'

// return direct and tell if pool is exhausted, if not it will run and can't really fail!
export function encryptPasswordSync(
  dbUser: PasswordDataInput,
  password: string,
): Result<Promise<bigint>, ResourceExhausted> {
  const salt = getUserCryptographicSalt(dbUser)
  return SecretKeyCryptographyCreateKey(salt, password)
}

export function encryptPassword(dbUser: PasswordDataInput, password: string): Promise<bigint> {
  const result = encryptPasswordSync(dbUser, password)
  if (!result.success) {
    throw new Error(result.error.clientMessage)
  }
  return result.value
}

export const verifyPassword = async (dbUser: User | DbUser, password: string): Promise<boolean> => {
  if (!dbUser.password) {
    return false
  }
  const encryptedPassword = await encryptPassword(dbUser, password)
  return dbUser.password.toString() === encryptedPassword.toString()
}

// for login function which should return even on error after the same time,
// at it would return with full passwort verify check, without blocking cpu time for this
// to prevent changing the login function into a account oracel
// todo: calculate time on startup for the actual hardware rather than assuming the same value for every server configuration
export function fakeVerifyPassword(): Promise<void> {
  return delay(650 + Math.floor(Math.random() * 101) - 50)
}
