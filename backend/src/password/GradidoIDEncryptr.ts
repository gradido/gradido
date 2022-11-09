import { User } from '@entity/User'
import { SecretKeyCryptographyCreateKey } from './EncryptorUtils'
import { PasswordEncryptr } from './PasswordEncryptr'

export class GradidoIDEncryptr implements PasswordEncryptr {
  async encryptPassword(dbUser: User, password: string): Promise<bigint> {
    const keyBuffer = SecretKeyCryptographyCreateKey(dbUser.gradidoID, password) // return short and long hash
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
