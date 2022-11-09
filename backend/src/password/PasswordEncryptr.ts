import { User } from '@entity/User'

export interface PasswordEncryptr {
  encryptPassword(dbUser: User, password: string): Promise<bigint>
  verifyPassword(dbUser: User, password: string): Promise<boolean>
}
