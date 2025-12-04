import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'
import { User } from 'database'
import { getLogger } from 'log4js'
import {
  crypto_box_SEEDBYTES,
  crypto_hash_sha512_BYTES,
  crypto_hash_sha512_final,
  crypto_hash_sha512_init,
  crypto_hash_sha512_STATEBYTES,
  crypto_hash_sha512_update,
  crypto_pwhash,
  crypto_pwhash_MEMLIMIT_MIN,
  crypto_pwhash_OPSLIMIT_MIN,
  crypto_pwhash_SALTBYTES,
  crypto_shorthash,
  crypto_shorthash_BYTES,
  crypto_shorthash_KEYBYTES,
} from 'sodium-native'
import { CONFIG } from '@/config'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.password.EncryptorUtils`)

const SecretKeyCryptographyCreateKeyMock = (
  salt: string,
  password: string,
  configLoginAppSecret: Buffer,
  configLoginServerKey: Buffer,
): bigint => {
  const state = Buffer.alloc(crypto_hash_sha512_STATEBYTES)
  crypto_hash_sha512_init(state)
  crypto_hash_sha512_update(state, Buffer.from(salt))
  crypto_hash_sha512_update(state, configLoginAppSecret)
  const hash = Buffer.alloc(crypto_hash_sha512_BYTES)
  crypto_hash_sha512_final(state, hash)

  const encryptionKey = Buffer.alloc(crypto_box_SEEDBYTES)
  const opsLimit = crypto_pwhash_OPSLIMIT_MIN
  const memLimit = crypto_pwhash_MEMLIMIT_MIN
  const algo = 2
  crypto_pwhash(
    encryptionKey,
    Buffer.from(password),
    hash.slice(0, crypto_pwhash_SALTBYTES),
    opsLimit,
    memLimit,
    algo,
  )

  const encryptionKeyHash = Buffer.alloc(crypto_shorthash_BYTES)
  crypto_shorthash(encryptionKeyHash, encryptionKey, configLoginServerKey)

  return encryptionKeyHash.readBigUInt64LE()
}

const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')

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
    logger.trace('call worker for: SecretKeyCryptographyCreateKey')
    if (configLoginServerKey.length !== crypto_shorthash_KEYBYTES) {
      throw new LogError(
        'ServerKey has an invalid size',
        configLoginServerKey.length,
        crypto_shorthash_KEYBYTES,
      )
    }
    return Promise.resolve(
      SecretKeyCryptographyCreateKeyMock(
        salt,
        password,
        configLoginAppSecret,
        configLoginServerKey,
      ),
    )
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
