import { createPrivateKey, createPublicKey } from 'crypto'

import { compactDecrypt, compactVerify, CompactSign, CompactEncrypt } from 'jose'

import {
  crypto_sign_ed25519_pk_to_curve25519,
  crypto_sign_ed25519_sk_to_curve25519,
  crypto_sign_SECRETKEYBYTES,
  crypto_box_PUBLICKEYBYTES,
  crypto_box_SECRETKEYBYTES,
} from 'sodium-native'

interface JWSPayload {
  nonce: number
  time: Date
}
interface JWEPayload {
  jws: string
  publicKey: string
}
interface KeyPair {
  publicKey: Buffer
  privateKey: Buffer
}

// eslint-disable-next-line camelcase
const jwk_ed25519_pk = (publicKey: Buffer) => {
  return createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: publicKey.toString('base64url'),
    },
    format: 'jwk',
  })
}

// eslint-disable-next-line camelcase
const jwk_ed25519_sk = (keyPair: KeyPair) => {
  return createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: keyPair.publicKey.toString('base64url'),
      d: keyPair.privateKey.subarray(0, crypto_sign_SECRETKEYBYTES).toString('base64url'),
    },
    format: 'jwk',
  })
}

// eslint-disable-next-line camelcase
const jwk_x25519_pk = (publicKey: Buffer) => {
  const publicKeyX = Buffer.alloc(crypto_box_PUBLICKEYBYTES)
  crypto_sign_ed25519_pk_to_curve25519(publicKeyX, publicKey)
  return createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: publicKeyX.toString('base64url'),
    },
    format: 'jwk',
  })
}

// eslint-disable-next-line camelcase
const jwk_x25519_sk = (keyPair: KeyPair) => {
  const pubKeyX = Buffer.alloc(crypto_box_PUBLICKEYBYTES)
  const privKeyX = Buffer.alloc(crypto_box_SECRETKEYBYTES)
  crypto_sign_ed25519_pk_to_curve25519(pubKeyX, keyPair.publicKey)
  crypto_sign_ed25519_sk_to_curve25519(
    privKeyX,
    keyPair.privateKey.subarray(0, crypto_sign_SECRETKEYBYTES),
  )
  return createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: pubKeyX.toString('base64url'),
      d: privKeyX.toString('base64url'),
    },
    format: 'jwk',
  })
}

export const verifyToken = async (token: string, keyPair: KeyPair, nonce: number | null = null) => {
  const key = jwk_x25519_sk(keyPair)
  const { plaintext } = await compactDecrypt(token, key)
  const decryptedJWEPayload = JSON.parse(new TextDecoder().decode(plaintext)) as JWEPayload
  // TODO validate `decryptedJWEPayload.publicKey` to be in database/authorized
  const foreignKey = jwk_ed25519_pk(Buffer.from(decryptedJWEPayload.publicKey))
  const { payload: payloadJWS } = await compactVerify(decryptedJWEPayload.jws, foreignKey)
  const decryptedJWSPayload = JSON.parse(new TextDecoder().decode(payloadJWS)) as JWSPayload
  // TODO validate `decryptedJWSPayload.time`

  if (nonce && decryptedJWSPayload.nonce !== nonce) {
    throw new Error('Could not verify nonce')
  }

  return { publicKey: decryptedJWEPayload.publicKey, ...decryptedJWSPayload }
}

export const generateToken = async (nonce: number, keyPair: KeyPair, receiverPublicKey: Buffer) => {
  const key = jwk_ed25519_sk(keyPair)
  const foreignPub = jwk_x25519_pk(receiverPublicKey)
  const jws = await new CompactSign(
    new TextEncoder().encode(
      JSON.stringify({
        nonce,
        time: new Date(),
      }),
    ),
  )
    .setProtectedHeader({ alg: 'EdDSA' })
    .sign(key)
  return await new CompactEncrypt(
    new TextEncoder().encode(
      JSON.stringify({
        jws,
        publicKey: keyPair.publicKey,
      }),
    ),
  )
    .setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' })
    .encrypt(foreignPub)
}
