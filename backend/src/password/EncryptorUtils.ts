/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { cpus } from 'os'
import path from 'path'

import { User } from '@entity/User'
import { pool } from 'workerpool'

import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { crypto_shorthash_KEYBYTES } from 'sodium-native'

const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')

// TODO: put maxQueueSize into config
const encryptionWorkerPool = pool(
  path.join(__dirname, '..', '..', 'build', 'src', 'password', '/EncryptionWorker.ts'),
  {
    maxQueueSize: 30 * cpus().length,
  },
)

// We will reuse this for changePassword
export const isValidPassword = (password: string): boolean => {
  return !!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \\t\\n\\r]).{8,}$/)
}

/**
 * @param salt
 * @param password
 * @returns can throw an exception if worker pool is full, if more than 30 * cpu core count logins happen in a time range of 30 seconds
 */
export const SecretKeyCryptographyCreateKey = async (
  salt: string,
  password: string,
): Promise<Uint8Array[]> => {
  try {
    logger.trace('call worker for: SecretKeyCryptographyCreateKey')
    if (configLoginServerKey.length !== crypto_shorthash_KEYBYTES) {
      throw new LogError(
        'ServerKey has an invalid size',
        configLoginServerKey.length,
        crypto_shorthash_KEYBYTES,
      )
    }
    return (await encryptionWorkerPool.exec('SecretKeyCryptographyCreateKey', [
      salt,
      password,
      configLoginAppSecret,
      configLoginServerKey,
    ])) as Promise<Uint8Array[]>
  } catch (e) {
    // pool is throwing this error
    // throw new Error('Max queue size of ' + this.maxQueueSize + ' reached');
    // will be shown in frontend to user
    throw new LogError('Server is full, please try again in 10 minutes.', e)
  }
}

export const getUserCryptographicSalt = (dbUser: User): string => {
  switch (dbUser.passwordEncryptionType) {
    case PasswordEncryptionType.NO_PASSWORD:
      throw new LogError('User has no password set', dbUser.id)
    case PasswordEncryptionType.EMAIL:
      return dbUser.emailContact.email
    case PasswordEncryptionType.GRADIDO_ID:
      return dbUser.gradidoID
    default:
      throw new LogError('Unknown password encryption type', dbUser.passwordEncryptionType)
  }
}
