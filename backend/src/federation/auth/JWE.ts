import { createPrivateKey, createPublicKey } from 'crypto'

import { compactDecrypt, compactVerify, CompactSign, CompactEncrypt } from 'jose'

import {
  crypto_sign_ed25519_pk_to_curve25519,
  crypto_sign_ed25519_sk_to_curve25519,
  crypto_sign_SECRETKEYBYTES,
  crypto_box_PUBLICKEYBYTES,
  crypto_box_SECRETKEYBYTES,
} from 'sodium-native'

export const verifyToken = async (
  token: string,
  keyPair: { publicKey: Buffer; privateKey: Buffer },
  nonce: number | null = null,
) => {
  const pubKeyX = Buffer.alloc(crypto_box_PUBLICKEYBYTES)
  const privKeyX = Buffer.alloc(crypto_box_SECRETKEYBYTES)
  crypto_sign_ed25519_pk_to_curve25519(pubKeyX, keyPair.publicKey)
  crypto_sign_ed25519_sk_to_curve25519(
    privKeyX,
    keyPair.privateKey.subarray(0, crypto_sign_SECRETKEYBYTES),
  )
  const key = createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: pubKeyX.toString('base64url'),
      d: privKeyX.toString('base64url'),
    },
    format: 'jwk',
  })

  const { plaintext } = await compactDecrypt(token, key)
  const decryptedJWEPayload = JSON.parse(new TextDecoder().decode(plaintext)) as {
    jws: string
    publicKey: string
  }
  const foreignPub = createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: Buffer.from(decryptedJWEPayload.publicKey).toString('base64url'),
    },
    format: 'jwk',
  })
  // TODO: verify clientPubKey (e.g. check federation table + rights here)
  const { payload: payloadJWS } = await compactVerify(decryptedJWEPayload.jws, foreignPub)
  const receivedNonce = JSON.parse(new TextDecoder().decode(payloadJWS)) as {
    nonce: number
    time: Date
  }

  if (nonce && receivedNonce.nonce !== nonce) {
    throw new Error('Could not verify nonce')
  }

  return { publicKey: decryptedJWEPayload.publicKey, nonce: receivedNonce.nonce }
}

export const generateToken = async (
  nonce: number,
  keyPair: { publicKey: Buffer; privateKey: Buffer },
  receiverPublicKey: Buffer,
) => {
  const receiverPublicKeyX = Buffer.alloc(crypto_box_PUBLICKEYBYTES)
  crypto_sign_ed25519_pk_to_curve25519(receiverPublicKeyX, receiverPublicKey)
  const key = createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: keyPair.publicKey.toString('base64url'),
      d: keyPair.privateKey.subarray(0, crypto_sign_SECRETKEYBYTES).toString('base64url'),
    },
    format: 'jwk',
  })
  const foreignPub = createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: receiverPublicKeyX.toString('base64url'),
    },
    format: 'jwk',
  })
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
