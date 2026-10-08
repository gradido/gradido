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

/**
 * For the login: an unknown address is answered the way a known one would be, so the answer
 * tells nobody whether the account exists -- without spending a thread on it. Under load
 * that is the refusal a real verification gets (encryptPassword's "server is full"), at
 * once; otherwise it is the time a real one takes, what the hashing threads measure right
 * now: the wait in the queue plus one derivation on this hardware, with the scatter a real
 * one currently has, not a figure assumed for every server.
 */
export async function fakeVerifyPassword(): Promise<void> {
  const context = AppContext.getInstance()
  const refusal = context.passwordHashingRefusalNow()
  if (refusal) {
    throw new Error(refusal.clientMessage)
  }
  const stats = context.getPasswordHashingStats()
  const expectedMs = stats.expectedWaitMs + stats.averageDurationMs
  const scatter = expectedMs * (Math.random() * 0.2 - 0.1)
  await delay(Math.round(expectedMs + scatter))
}
