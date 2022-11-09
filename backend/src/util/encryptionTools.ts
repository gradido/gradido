import fs from 'fs'
import CONFIG from '@/config'
import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const random = require('random-bigint')

// We will reuse this for changePassword
export const isPassword = (password: string): boolean => {
  return !!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \\t\\n\\r]).{8,}$/)
}

export const PHRASE_WORD_COUNT = 24
const WORDS = fs
  .readFileSync('src/config/mnemonic.uncompressed_buffer13116.txt')
  .toString()
  .split(',')
export const PassphraseGenerate = (): string[] => {
  logger.trace('PassphraseGenerate...')
  const result = []
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    result.push(WORDS[sodium.randombytes_random() % 2048])
  }
  return result
}

export const SecretKeyCryptographyEncrypt = (message: Buffer, encryptionKey: Buffer): Buffer => {
  logger.trace('SecretKeyCryptographyEncrypt...')
  const encrypted = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_easy(encrypted, message, nonce, encryptionKey)
  logger.debug(`SecretKeyCryptographyEncrypt...successful`)
  return encrypted
}

export const SecretKeyCryptographyDecrypt = (
  encryptedMessage: Buffer,
  encryptionKey: Buffer,
): Buffer => {
  logger.trace('SecretKeyCryptographyDecrypt...')
  const message = Buffer.alloc(encryptedMessage.length - sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_open_easy(message, encryptedMessage, nonce, encryptionKey)

  logger.debug(`SecretKeyCryptographyDecrypt...successful`)
  return message
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

  logger.debug(`SecretKeyCryptographyCreateKey...successful`)
  return [encryptionKeyHash, encryptionKey]
}

export const KeyPairEd25519Create = (passphrase: string[]): Buffer[] => {
  logger.trace('KeyPairEd25519Create...')
  if (!passphrase.length || passphrase.length < PHRASE_WORD_COUNT) {
    logger.error('passphrase empty or to short')
    throw new Error('passphrase empty or to short')
  }

  const state = Buffer.alloc(sodium.crypto_hash_sha512_STATEBYTES)
  sodium.crypto_hash_sha512_init(state)

  // To prevent breaking existing passphrase-hash combinations word indices will be put into 64 Bit Variable to mimic first implementation of algorithms
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    const value = Buffer.alloc(8)
    const wordIndex = WORDS.indexOf(passphrase[i])
    value.writeBigInt64LE(BigInt(wordIndex))
    sodium.crypto_hash_sha512_update(state, value)
  }
  // trailing space is part of the login_server implementation
  const clearPassphrase = passphrase.join(' ') + ' '
  sodium.crypto_hash_sha512_update(state, Buffer.from(clearPassphrase))
  const outputHashBuffer = Buffer.alloc(sodium.crypto_hash_sha512_BYTES)
  sodium.crypto_hash_sha512_final(state, outputHashBuffer)

  const pubKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  const privKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_sign_seed_keypair(
    pubKey,
    privKey,
    outputHashBuffer.slice(0, sodium.crypto_sign_SEEDBYTES),
  )
  logger.debug(`KeyPair creation ready. pubKey=${pubKey}`)

  return [pubKey, privKey]
}

export const encryptCommunityPrivateKey = (
  privKey: Buffer,
  uuid: string,
  secret: string,
): Buffer => {
  const keyHash = SecretKeyCryptographyCreateKey(uuid, secret) // return short and long hash
  // const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
  const encryptedPrivkey = SecretKeyCryptographyEncrypt(privKey, keyHash[1])
  logger.trace('Community privateKey encrypted ...')
  return encryptedPrivkey
}

export const decryptCommunityPrivateKey = (
  encryptedPrivKey: Buffer,
  uuid: string,
  secret: string,
): Buffer => {
  const keyHash = SecretKeyCryptographyCreateKey(uuid, secret) // return short and long hash
  const privKey = SecretKeyCryptographyDecrypt(encryptedPrivKey, keyHash[1])
  logger.trace('Community privateKey decrypted ...')
  return privKey
}
