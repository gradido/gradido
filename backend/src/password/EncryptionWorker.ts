import { worker } from 'workerpool'

import { CONFIG } from '@/config'

import {
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
} from 'sodium-native'

export const SecretKeyCryptographyCreateKey = (
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
  return encryptionKeyHash.readBigUInt64LE()
}

if (CONFIG.USE_CRYPTO_WORKER === true && typeof process.send === 'function') {
  worker({
    SecretKeyCryptographyCreateKey,
  })
}
