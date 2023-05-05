/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { User } from '@entity/User'
/* eslint-disable camelcase */
import {
  crypto_shorthash_KEYBYTES,
  crypto_box_SEEDBYTES,
  crypto_hash_sha512_BYTES,
  crypto_shorthash_BYTES,
  crypto_pwhash_SALTBYTES,
  crypto_pwhash,
  crypto_shorthash,
  crypto_hash_sha512_instance,
} from 'sodium-native'
/* eslint-enable camelcase */

import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs

// We will reuse this for changePassword
export const isValidPassword = (password: string): boolean => {
  return !!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \\t\\n\\r]).{8,}$/)
}

export const SecretKeyCryptographyCreateKey = (salt: string, password: string): Buffer[] => {
  logger.trace('SecretKeyCryptographyCreateKey...')
  const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
  const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')
  // eslint-disable-next-line camelcase
  if (configLoginServerKey.length !== crypto_shorthash_KEYBYTES) {
    throw new LogError(
      'ServerKey has an invalid size',
      configLoginServerKey.length,
      crypto_shorthash_KEYBYTES,
    )
  }

  const sha512Instance = crypto_hash_sha512_instance()
  sha512Instance.update(Buffer.from(salt))
  sha512Instance.update(configLoginAppSecret)
  const hash = Buffer.alloc(crypto_hash_sha512_BYTES)
  sha512Instance.final(hash)

  const encryptionKey = Buffer.alloc(crypto_box_SEEDBYTES)
  const opsLimit = 10
  const memLimit = 33554432
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

  return [encryptionKeyHash, encryptionKey]
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
