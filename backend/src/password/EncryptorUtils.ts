/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { User } from '@entity/User'

import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs
const sodium = require('sodium-native')

// We will reuse this for changePassword
export const isValidPassword = (password: string): boolean => {
  return !!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \\t\\n\\r]).{8,}$/)
}

export const SecretKeyCryptographyCreateKey = (salt: string, password: string): Buffer[] => {
  logger.trace('SecretKeyCryptographyCreateKey...')
  const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
  const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')
  if (configLoginServerKey.length !== sodium.crypto_shorthash_KEYBYTES) {
    throw new LogError(
      'ServerKey has an invalid size',
      configLoginServerKey.length,
      sodium.crypto_shorthash_KEYBYTES,
    )
  }

  const state = Buffer.alloc(sodium.crypto_hash_sha512_STATEBYTES)
  sodium.crypto_hash_sha512_init(state)
  sodium.crypto_hash_sha512_update(state, Buffer.from(salt))
  sodium.crypto_hash_sha512_update(state, configLoginAppSecret)
  const hash = Buffer.alloc(sodium.crypto_hash_sha512_BYTES)
  sodium.crypto_hash_sha512_final(state, hash)

  const encryptionKey = Buffer.alloc(sodium.crypto_box_SEEDBYTES)
  const opsLimit = 10
  const memLimit = 33554432
  const algo = 2
  sodium.crypto_pwhash(
    encryptionKey,
    Buffer.from(password),
    hash.slice(0, sodium.crypto_pwhash_SALTBYTES),
    opsLimit,
    memLimit,
    algo,
  )

  const encryptionKeyHash = Buffer.alloc(sodium.crypto_shorthash_BYTES)
  sodium.crypto_shorthash(encryptionKeyHash, encryptionKey, configLoginServerKey)

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
