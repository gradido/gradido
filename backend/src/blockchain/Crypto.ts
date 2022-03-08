import fs from 'fs'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

const PHRASE_WORD_COUNT = 24
const WORDS = fs.readFileSync('src/config/mnemonic.english.txt').toString().split('\n')

function KeyPairEd25519Create(passphrase: string[]): Buffer[] {
  if (!passphrase.length || passphrase.length < PHRASE_WORD_COUNT) {
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

  return [pubKey, privKey]
}

export { KeyPairEd25519Create, PHRASE_WORD_COUNT }
