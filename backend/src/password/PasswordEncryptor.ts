import { delay } from 'core'
import { DbUser, User } from 'database'
import { AppContext, PasswordHashPriority, ResourceExhausted, Result } from 'shared'

import { getUserCryptographicSalt } from './EncryptorUtils'
import { PasswordDataInput } from './passwordData.schema'

/**
 * Hands the derivation to the hashing threads of the app context. Whether it took a place in
 * its queue is known at once and is the result; a full queue is the expected failure. Once
 * queued it cannot really fail: the promise carries the key.
 *
 * The priority is the queue: HIGH for the login, which a member is waiting for, LOW for
 * everything else.
 */
export function encryptPasswordSync(
  dbUser: PasswordDataInput,
  password: string,
  priority: PasswordHashPriority = PasswordHashPriority.LOW,
): Result<Promise<bigint>, ResourceExhausted> {
  const salt = getUserCryptographicSalt(dbUser)
  return AppContext.getInstance().hashPassword(salt, password, priority)
}

export function encryptPassword(
  dbUser: PasswordDataInput,
  password: string,
  priority: PasswordHashPriority = PasswordHashPriority.LOW,
): Promise<bigint> {
  const result = encryptPasswordSync(dbUser, password, priority)
  if (!result.success) {
    throw new Error(result.error.clientMessage)
  }
  return result.value
}

export const verifyPassword = async (
  dbUser: User | DbUser,
  password: string,
  priority: PasswordHashPriority = PasswordHashPriority.LOW,
): Promise<boolean> => {
  if (!dbUser.password) {
    return false
  }
  const encryptedPassword = await encryptPassword(dbUser, password, priority)
  return dbUser.password.toString() === encryptedPassword.toString()
}

// for login function which should return even on error after the same time,
// at it would return with full passwort verify check, without blocking cpu time for this
// to prevent changing the login function into a account oracel
// todo: calculate time on startup for the actual hardware rather than assuming the same value for every server configuration
export function fakeVerifyPassword(): Promise<void> {
  return delay(650 + Math.floor(Math.random() * 101) - 50)
}
