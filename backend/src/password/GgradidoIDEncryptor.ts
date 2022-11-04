import { User } from '@entity/User'
import { SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export async function encryptPasswordPerGradidoId(dbUser: User, password: string): Promise<bigint> {
  const keyBuffer = SecretKeyCryptographyCreateKey(dbUser.gradidoID, password) // return short and long hash
  const passwordHash = keyBuffer[0].readBigUInt64LE()

  return passwordHash
}

export async function verifyPasswordPerGradidoId(dbUser: User, password: string): Promise<boolean> {
  if (
    BigInt(password) !== (await encryptPasswordPerGradidoId(dbUser, dbUser.password.toString()))
  ) {
    return false
  }
  return true
}
