import CONFIG from '@/config'
import { backendLogger as logger } from '@/server/logger'
import { User } from '@entity/User'
import { PasswordEncryptionType } from '@enum/PasswordEncryptionType'

// eslint-disable-next-line @typescript-eslint/no-var-requires
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
    logger.error(
      `ServerKey has an invalid size. The size must be ${sodium.crypto_shorthash_KEYBYTES} bytes.`,
    )
    throw new Error(
      `ServerKey has an invalid size. The size must be ${sodium.crypto_shorthash_KEYBYTES} bytes.`,
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
    case PasswordEncryptionType.NO_PASSWORD: {
      logger.error('Password not set for user ' + dbUser.id)
      throw new Error('Password not set for user ' + dbUser.id) // user has no password
    }
    case PasswordEncryptionType.EMAIL: {
      return dbUser.emailContact.email
      break
    }
    case PasswordEncryptionType.GRADIDO_ID: {
      return dbUser.gradidoID
      break
    }
    default:
      logger.error(`Unknown password encryption type: ${dbUser.passwordEncryptionType}`)
      throw new Error(`Unknown password encryption type: ${dbUser.passwordEncryptionType}`)
  }
}
