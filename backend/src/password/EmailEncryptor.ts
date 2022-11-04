import { User } from '@entity/User'
import { SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export async function encryptPasswordPerEmail(dbUser: User, password: string): Promise<bigint> {
  const keyBuffer = SecretKeyCryptographyCreateKey(dbUser.emailContact.email, password) // return short and long hash
  const passwordHash = keyBuffer[0].readBigUInt64LE()

  return passwordHash
}

export async function verifyPasswordPerEmail(dbUser: User, password: string): Promise<boolean> {
  if (BigInt(password) !== (await encryptPasswordPerEmail(dbUser, dbUser.password.toString()))) {
    return false
  }
  return true
}
