import { cpus } from 'node:os'
import path from 'node:path'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { User } from 'database'
import { crypto_shorthash_KEYBYTES } from 'sodium-native'
import { Pool, pool } from 'workerpool'
import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'

import { SecretKeyCryptographyCreateKeyFunc } from './EncryptionWorker.js'

const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')

let encryptionWorkerPool: Pool | undefined

if (CONFIG.USE_CRYPTO_WORKER === true) {
  encryptionWorkerPool = pool(path.join(__dirname, 'worker.js'), {
    maxQueueSize: 30 * cpus().length,
  })
}

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
): Promise<bigint> => {
  try {
    if (configLoginServerKey.length !== crypto_shorthash_KEYBYTES) {
      throw new LogError(
        'ServerKey has an invalid size',
        configLoginServerKey.length,
        crypto_shorthash_KEYBYTES,
      )
    }
    let result: bigint
    if (encryptionWorkerPool) {
      result = await encryptionWorkerPool.exec('SecretKeyCryptographyCreateKeyFunc', [
        salt,
        password,
        configLoginAppSecret,
        configLoginServerKey,
      ])
    } else {
      result = SecretKeyCryptographyCreateKeyFunc(
        salt,
        password,
        configLoginAppSecret,
        configLoginServerKey,
      )
    }
    return result
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
