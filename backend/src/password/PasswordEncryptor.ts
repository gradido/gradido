import { PasswordEncryptionType } from '@/graphql/enum/PasswordEncryptionType'
import { User } from '@entity/User'
import { encryptPasswordPerEmail, verifyPasswordPerEmail } from './emailEncryptor'
import { isValidPassword } from './EncryptorUtils'
import { encryptPasswordPerGradidoId, verifyPasswordPerGradidoId } from './GgradidoIDEncryptor'

export async function encryptPassword(dbUser: User, password: string): Promise<bigint> {
  let passwordHash = BigInt(0)
  switch (dbUser.passwordEncryptionType) {
    case PasswordEncryptionType.ONE_TIME:
      break
    case PasswordEncryptionType.EMAIL:
      passwordHash = await encryptPasswordPerEmail(dbUser, password)
      break
    case PasswordEncryptionType.GRADIDO_ID:
      passwordHash = await encryptPasswordPerGradidoId(dbUser, password)
      break
    default:
      throw new Error(
        `unsupported password encryption type in user with gradidoID=${dbUser.gradidoID}`,
      )
  }
  return passwordHash
}

export async function verifyPassword(dbUser: User, password: string): Promise<boolean> {
  let result = false
  switch (dbUser.passwordEncryptionType) {
    case PasswordEncryptionType.ONE_TIME:
      break
    case PasswordEncryptionType.EMAIL:
      result = await verifyPasswordPerEmail(dbUser, password)
      break
    case PasswordEncryptionType.GRADIDO_ID:
      result = await verifyPasswordPerGradidoId(dbUser, password)
      break
    default:
      throw new Error(
        `unsupported password encryption type in user with gradidoID=${dbUser.gradidoID}`,
      )
  }
  return result
}

export async function isPassword(password: string): Promise<boolean> {
  return isValidPassword(password)
}
