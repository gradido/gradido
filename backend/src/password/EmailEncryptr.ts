import { User } from '@entity/User'
import { PasswordEncryptr } from './PasswordEncryptr'
import { SecretKeyCryptographyCreateKey } from './EncryptorUtils'

export class EmailEncryptr implements PasswordEncryptr {
  async encryptPassword(dbUser: User, password: string): Promise<bigint> {
    const keyBuffer = SecretKeyCryptographyCreateKey(dbUser.emailContact.email, password) // return short and long hash
    const passwordHash = keyBuffer[0].readBigUInt64LE()

    return passwordHash
  }

  async verifyPassword(dbUser: User, password: string): Promise<boolean> {
    if (BigInt(password) !== (await this.encryptPassword(dbUser, dbUser.password.toString()))) {
      return false
    }
    return true
  }
}
