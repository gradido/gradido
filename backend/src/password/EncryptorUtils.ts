import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import * as v from 'valibot'
import { LogError } from '@/server/LogError'
import { PasswordDataInput, passwordDataSchema } from './passwordData.schema'

/**
 * ⛔ Which string a password was derived from. It decides whether a stored hash can be
 * reproduced at all, so it reads the scheme off the row it is handed and nothing else.
 * The derivation itself lives in the native app context (shared's AppContext).
 */
export const getUserCryptographicSalt = (passwordData: PasswordDataInput): string => {
  const user = v.parse(passwordDataSchema, passwordData)
  switch (user.passwordEncryptionType) {
    case PasswordEncryptionType.NO_PASSWORD:
      throw new LogError('User has no password set', user.id)
    case PasswordEncryptionType.EMAIL:
      if (!user.emailContact) {
        throw new Error('Missing email contact for PasswordEncryptionType Email')
      }
      return user.emailContact.email
    case PasswordEncryptionType.GRADIDO_ID:
      if (!user.gradidoId) {
        throw new Error('Missing gradido uuid for PasswordEncryptionType GRADIDO_ID')
      }
      return user.gradidoId
    default:
      throw new LogError('Unknown password encryption type', user.passwordEncryptionType)
  }
}
