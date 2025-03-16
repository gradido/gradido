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
import { createHash } from 'node:crypto'

export const SecretKeyCryptographyCreateKey = (
  salt: string,
  password: string,
  configLoginAppSecret: Buffer,
  configLoginServerKey: Buffer,
): bigint => {
  /*
  console.log('SecretKeyCryptographyCreateKey')
  const state = Buffer.alloc(crypto_hash_sha512_STATEBYTES)
  crypto_hash_sha512_init(state)
  console.log('before salt')
  console.log('salt as buffer', Buffer.from(salt).toString('hex'))
  crypto_hash_sha512_update(state, Buffer.from(salt))
  console.log('before configLoginAppSecret')
  console.log('configLoginAppSecret', configLoginAppSecret.toString('hex'))
  crypto_hash_sha512_update(state, configLoginAppSecret)
  const hash = Buffer.alloc(crypto_hash_sha512_BYTES)
  console.log('hash buffer size', hash.length)
  console.log('before final')
  console.log(typeof crypto_hash_sha512_final)
  crypto_hash_sha512_final(state, hash)
  console.log('after final')
  console.log('hash', hash.toString('hex'))
*/
  const state = createHash('sha512')
  state.update(Buffer.from(salt))
  state.update(configLoginAppSecret)
  const hash = state.digest()
  console.log('hash', hash.toString('hex'))

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
