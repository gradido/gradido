/* eslint-disable camelcase */
import {
  crypto_sign_seed_keypair,
  crypto_sign_PUBLICKEYBYTES,
  crypto_sign_SECRETKEYBYTES,
  crypto_sign_SEEDBYTES,
} from 'sodium-native'
/* eslint-enable camelcase */

export const createKeyPair = (seed: string) => {
  const publicKey = Buffer.allocUnsafe(crypto_sign_PUBLICKEYBYTES)
  const secretKey = Buffer.allocUnsafe(crypto_sign_SECRETKEYBYTES)
  const seedBuffer = Buffer.alloc(crypto_sign_SEEDBYTES, seed)
  crypto_sign_seed_keypair(publicKey, secretKey, seedBuffer)
  return { publicKey, secretKey }
}
