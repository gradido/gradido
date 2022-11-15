import { User } from '@entity/User'
import { logger } from '@test/testSetup'
import { getBasicCryptographicKey, SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export class PasswordEncryptr {
  async encryptPassword(dbUser: User, password: string): Promise<bigint> {
    const basicKey = getBasicCryptographicKey(dbUser)
    if (!basicKey) logger.error('Password not set for user ' + dbUser.id)
    else {
      const keyBuffer = SecretKeyCryptographyCreateKey(basicKey, password) // return short and long hash
      const passwordHash = keyBuffer[0].readBigUInt64LE()
      return passwordHash
    }

    throw new Error('Password not set for user ' + dbUser.id) // user has no password
  }

  async verifyPassword(dbUser: User, password: string): Promise<boolean> {
    const basicKey = getBasicCryptographicKey(dbUser)
    if (!basicKey) logger.error('Password not set for user ' + dbUser.id)
    else {
      if (BigInt(password) !== (await this.encryptPassword(dbUser, dbUser.password.toString()))) {
        return false
      }
      return true
    }

    throw new Error('Password not set for user ' + dbUser.id) // user has no password
  }
}
