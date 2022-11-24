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
  logger.debug('SecretKeyCryptographyDecrypt...')
  const message = Buffer.alloc(encryptedMessage.length - sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce
  logger.debug(`message=${message}, nonce=${nonce}`)
  sodium.crypto_secretbox_open_easy(message, encryptedMessage, nonce, encryptionKey)
  logger.debug(`decrypted message=${message}`)

  logger.debug(`SecretKeyCryptographyDecrypt...successful`)
  return message
}

export const SecretKeyCryptographyCreateKey = (salt: string, password: string): Buffer[] => {
  logger.debug(`SecretKeyCryptographyCreateKey(salt=${salt}, password=${password})...`)
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

export async function createKeyPair(uuid: string): Promise<{ publicKey: any; secretKey: any }> {
  const keypair = {
    publicKey: sodium.sodium_malloc(sodium.crypto_box_PUBLICKEYBYTES),
    secretKey: sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES),
  }
  const uuidAsSeed = uuid.replace('-', '').replace('-', '').replace('-', '').replace('-', '')
  logger.debug(`uuid=${uuid}=${uuid.length}, uuidAsSeed=${uuidAsSeed}=${uuidAsSeed.length}`)
  const seed = sodium.sodium_malloc(sodium.crypto_box_SEEDBYTES)
  seed.write(uuidAsSeed, 'hex')
  sodium.crypto_box_seed_keypair(keypair.publicKey, keypair.secretKey, seed)
  logger.debug(`createKeyPair(seed=${uuid})...successful`)
  return keypair
}

export const uuidAsSeed = (uuid: string): Buffer => {
  const uuidAsSeed = uuid.replace('-', '').replace('-', '').replace('-', '').replace('-', '')
  logger.debug(`uuid=${uuid}=${uuid.length}, uuidAsSeed=${uuidAsSeed}=${uuidAsSeed.length}`)
  const seed = sodium.sodium_malloc(sodium.crypto_box_SEEDBYTES)
  seed.write(uuidAsSeed, 'hex')
  return seed
}

export const getSeed = (): Buffer => {
  const secret = CONFIG.FEDERATE_KEY_SECRET || random(64)
  const seed = sodium.sodium_malloc(sodium.crypto_box_SEEDBYTES)
  seed.write(secret, 'hex')
  return seed
}

export async function testEncryptDecrypt(
  uuid: string,
  pubKey: Buffer,
  privKey: Buffer,
): Promise<void> {
  logger.debug(`uuid=${uuid}, pubKey=${pubKey.toString('hex')}, privKey=${privKey.toString('hex')}`)

  // Generate keys
  const skeypair = {
    publicKey: sodium.sodium_malloc(sodium.crypto_box_PUBLICKEYBYTES),
    privateKey: sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES),
  }
  // const uuidAsSeed = uuid.replace('-', '').replace('-', '').replace('-', '').replace('-', '')
  // logger.debug(`uuid=${uuid}=${uuid.length}, uuidAsSeed=${uuidAsSeed}=${uuidAsSeed.length}`)
  const seed = sodium.sodium_malloc(sodium.crypto_box_SEEDBYTES)
  seed.write(uuidAsSeed(uuid).toString(), 'hex')

  const sender = sodium.crypto_box_seed_keypair(skeypair.publicKey, skeypair.privateKey, seed) // crypto_box_keypair()

  const rkeypair = {
    publicKey: sodium.sodium_malloc(sodium.crypto_box_PUBLICKEYBYTES),
    privateKey: sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES),
  }
  const receiver = sodium.crypto_box_seed_keypair(rkeypair.publicKey, rkeypair.privateKey, seed)

  // Generate random nonce
  const nonce = Buffer.allocUnsafe(sodium.crypto_box_NONCEBYTES)
  sodium.randombytes_buf(nonce)

  // Encrypt
  const plainText = Buffer.from(uuid, 'hex')
  const cipherMsg = Buffer.alloc(plainText.length + sodium.crypto_box_MACBYTES)
  sodium.crypto_box_easy(cipherMsg, plainText, nonce, rkeypair.publicKey, skeypair.privateKey)

  // Decrypt
  const plainBuffer = Buffer.alloc(cipherMsg.length - sodium.crypto_box_MACBYTES)
  sodium.crypto_box_open_easy(
    plainBuffer,
    cipherMsg,
    nonce,
    skeypair.publicKey,
    rkeypair.privateKey,
  )

  // We should get the same plainText!
  if (plainBuffer.toString() === plainText.toString()) {
    logger.debug(
      `Message decrypted correctly ${plainBuffer.toString('hex')} === ${plainText.toString('hex')}`,
    )
  }
}

export async function encryptMessage(
  ownPrivKey: Buffer,
  foreignPubKey: Buffer,
  msgBuf: Buffer,
): Promise<Buffer> {
  logger.debug(
    `encryptMessage(privKey=${ownPrivKey.toString('hex')}, foreignPubKey=${foreignPubKey.toString(
      'hex',
    )}, msgBuf=${msgBuf.toString('hex')})...`,
  )

  logger.debug(`msgBuf=${msgBuf.toString('hex')}=${msgBuf.length}`)
  logger.debug(`crypto_secretbox_MACBYTES=${sodium.crypto_secretbox_MACBYTES}`)
  logger.debug(`msgBuf=${JSON.stringify(msgBuf)}=${msgBuf.length}`)

  // Generate random nonce
  const nonce = Buffer.allocUnsafe(sodium.crypto_box_NONCEBYTES)
  sodium.randombytes_buf(nonce)

  // Encrypt
  const cipherMsg = Buffer.alloc(msgBuf.length + sodium.crypto_box_MACBYTES)
  sodium.crypto_box_easy(cipherMsg, msgBuf, nonce, foreignPubKey, ownPrivKey)

  /*
  const decryptedMsgBuf = sodium.sodium_malloc(msgBuf.length + sodium.crypto_secretbox_MACBYTES) // Buffer.alloc(msg.length + sodium.crypto_box_MACBYTES) // Buffer length of any length
  const nonceBuf = sodium.sodium_malloc(sodium.crypto_secretbox_NONCEBYTES) // Buffer.alloc(sodium.crypto_box_NONCEBYTES).fill(31) // static nonce
  sodium.randombytes_buf(nonceBuf) // insert random data into nonce
  logger.debug(`nonceBuf=${nonceBuf.toString('hex')}=${nonceBuf.length}`)

  // sodium.crypto_secretbox_easy(c, m, n, sk)
  sodium.crypto_secretbox_easy(decryptedMsgBuf, msgBuf, nonceBuf, privKey)
  logger.debug(`decryptedMsgBuf=${decryptedMsgBuf.toString('hex')}=${decryptedMsgBuf.length}`)
  */
  const returnBuf = sodium.sodium_malloc(nonce.length + cipherMsg.length)
  returnBuf.write(nonce.toString('hex') + cipherMsg.toString('hex'), 'hex')

  logger.debug(`nonceBuf=${nonce.toString('hex')}=${nonce.length}`)
  logger.debug(`returnBuf=${returnBuf.toString('hex')}=${returnBuf.length}`)
  return returnBuf
}

export async function decryptMessage(
  ownPrivKey: Buffer,
  foreignPubKey: Buffer,
  msgBuf: Buffer,
): Promise<Buffer> {
  logger.debug(
    `decryptMessage(ownPrivKey=${ownPrivKey.toString(
      'hex',
    )}, foreignPubKey=${foreignPubKey.toString('hex')}, msgBuf=${msgBuf.toString('hex')}=${
      msgBuf.length
    })...`,
  )
  logger.debug(
    `msgBuf=${msgBuf.toString('hex')}=${msgBuf.length}, NONCEBYTES=${
      sodium.crypto_secretbox_NONCEBYTES
    }`,
  )

  const nonce = sodium.sodium_malloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.write(msgBuf.toString('hex').slice(0, sodium.crypto_secretbox_NONCEBYTES), 'hex')
  const encryptedMsgBuf = sodium.sodium_malloc(msgBuf.length - sodium.crypto_secretbox_NONCEBYTES)
  encryptedMsgBuf.write(
    msgBuf.toString('hex').slice(sodium.crypto_secretbox_NONCEBYTES, msgBuf.length),
    'hex',
  )
  logger.debug(`nonceBuf=${nonce.toString('hex')}=${nonce.length}`)
  logger.debug(`encryptedMsgBuf  =${encryptedMsgBuf.toString('hex')}=${encryptedMsgBuf.length}`)

  // Decrypt
  const plainBuffer = Buffer.alloc(msgBuf.length - sodium.crypto_box_MACBYTES)
  sodium.crypto_box_open_easy(plainBuffer, msgBuf, nonce, foreignPubKey, ownPrivKey)

  /*
  const decryptedMsgBuf = sodium.sodium_malloc(
    encryptedMsgBuf.length - sodium.crypto_secretbox_MACBYTES,
  ) // Buffer.alloc(msg.length - sodium.crypto_box_MACBYTES)
  if (!sodium.crypto_secretbox_open_easy(decryptedMsgBuf, encryptedMsgBuf, nonceBuf, pubKey)) {
    logger.debug('Decryption failed!')
  } else {
    logger.debug('Decrypted message:', decryptedMsgBuf, '(' + decryptedMsgBuf.toString() + ')')
  }
  */

  // const bool = sodium.crypto_box_open_easy(decryptedMsgBuf, msgBuf, nonceBuf, pubKey, privKey)
  //           sodium.crypto_box_open_easy(m, c, n, pk, sk)
  /*
  var nonce = payload.slice(0, sodium.crypto_box_NONCEBYTES);
  var encodedMessage = payload.slice(nonce.length, payload.length);

  var decodedMessage = sodium.crypto_box_open_easy(encodedMessage, nonce, publicKey, secretKey);

  var string = bytes_to_utf8(decodedMessage);
  // return toJSON ? JSON.parse(string) : string;
  logger.debug(
    `decryptMessage()...successful=${bool}: encryptedMsgBuf=${decryptedMsgBuf.toString()})`,
  )
  */
  return plainBuffer
}

/*
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
*/
