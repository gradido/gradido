import { User } from '@entity/User'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import {
  crypto_shorthash_KEYBYTES,
  crypto_box_SEEDBYTES,
  crypto_hash_sha512_init,
  crypto_hash_sha512_update,
  crypto_hash_sha512_final,
  crypto_hash_sha512_BYTES,
  crypto_hash_sha512_STATEBYTES,
  crypto_shorthash_BYTES,
  crypto_pwhash_SALTBYTES,
  crypto_pwhash,
  crypto_shorthash,
  crypto_secretbox_MACBYTES,
  crypto_secretbox_NONCEBYTES,
  crypto_secretbox_open_easy,
  crypto_secretbox_easy,
} from 'sodium-native'

import { getUserCryptographicSalt } from './EncryptorUtils'

export class SecretKeyCryptography {
  encryptionKey: Buffer

  constructor(saltProvider: User | string, password: string) {
    let salt = ''
    if (saltProvider instanceof User) {
      salt = getUserCryptographicSalt(saltProvider)
    } else {
      salt = saltProvider
    }
    this.createKey(salt, password)
  }

  /**
   * calculate password short hash from encryption key
   * @returns {bigint} containing short hash
   */
  getShortHash(): bigint {
    const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')
    if (configLoginServerKey.length !== crypto_shorthash_KEYBYTES) {
      throw new LogError(
        'ServerKey has an invalid size',
        configLoginServerKey.length,
        crypto_shorthash_KEYBYTES,
      )
    }
    const encryptionKeyHash = Buffer.alloc(crypto_shorthash_BYTES)
    crypto_shorthash(encryptionKeyHash, this.encryptionKey, configLoginServerKey)
    return encryptionKeyHash.readBigUInt64LE()
  }

  /**
   * decrypt message with this encryption key
   * @param message
   * @returns {Buffer | null} decrypted content or null if decryption failed
   */
  decrypt(message: Buffer): Buffer | null {
    const decrypted = Buffer.alloc(message.length - crypto_secretbox_MACBYTES)
    const nonce = Buffer.alloc(crypto_secretbox_NONCEBYTES)
    // we use a hardcoded value for nonce
    // TODO: use a dynamic value, save it along with the other parameters
    nonce.fill(31)
    if (crypto_secretbox_open_easy(decrypted, message, nonce, this.encryptionKey)) {
      return decrypted
    } else {
      logger.error("couldn't decrypt message with size", message.length)
    }
    return null
  }

  /**
   * encrypt message with this encryption key
   * @param message
   * @returns {Buffer} encrypted content or null if decryption failed
   */
  encrypt(message: Buffer): Buffer {
    const encrypted = Buffer.alloc(message.length + crypto_secretbox_MACBYTES)
    const nonce = Buffer.alloc(crypto_secretbox_NONCEBYTES)
    // we use a hardcoded value for nonce
    // TODO: use a dynamic value, save it along with the other parameters
    nonce.fill(31)
    crypto_secretbox_easy(encrypted, message, nonce, this.encryptionKey)

    return encrypted
  }

  // private functions

  private createKey(salt: string, password: string): void {
    logger.trace('SecretKeyCryptographyCreateKey...')
    const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
    const state = Buffer.alloc(crypto_hash_sha512_STATEBYTES)
    crypto_hash_sha512_init(state)
    crypto_hash_sha512_update(state, Buffer.from(salt))
    crypto_hash_sha512_update(state, configLoginAppSecret)
    const hash = Buffer.alloc(crypto_hash_sha512_BYTES)
    crypto_hash_sha512_final(state, hash)

    this.encryptionKey = Buffer.alloc(crypto_box_SEEDBYTES)
    const opsLimit = 10
    const memLimit = 33554432
    const algo = 2
    crypto_pwhash(
      this.encryptionKey,
      Buffer.from(password),
      hash.slice(0, crypto_pwhash_SALTBYTES),
      opsLimit,
      memLimit,
      algo,
    )
  }
}
