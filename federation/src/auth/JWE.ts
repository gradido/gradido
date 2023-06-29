import { createPrivateKey, createPublicKey } from 'crypto'

import { compactDecrypt, compactVerify, CompactSign, CompactEncrypt } from 'jose'

import {
  crypto_sign_ed25519_pk_to_curve25519,
  crypto_sign_ed25519_sk_to_curve25519,
} from 'sodium-native'

const crypto_scalarmult_curve25519_BYTES = 32

export const verifyToken = async (
  token: string,
  keyPair: { publicKey: Buffer; privateKey: Buffer },
  nonce: number | null = null,
) => {
  const pubKeyX = Buffer.alloc(crypto_scalarmult_curve25519_BYTES)
  const privKeyX = Buffer.alloc(crypto_scalarmult_curve25519_BYTES)
  crypto_sign_ed25519_pk_to_curve25519(pubKeyX, keyPair.publicKey)
  crypto_sign_ed25519_sk_to_curve25519(privKeyX, keyPair.privateKey.subarray(0, 32))
  const key = createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: keyPair.publicKey.toString('base64url'),
      d: keyPair.privateKey.subarray(0, 32).toString('base64url'),
    },
    format: 'jwk',
  })

  const { plaintext } = await compactDecrypt(token, key)
  const decryptedJWEPayload = JSON.parse(new TextDecoder().decode(plaintext)) as {
    jws: string // CompactSign
    publicKey: Buffer
  }
  const foreignPub = createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: decryptedJWEPayload.publicKey.toString('base64url'),
    },
    format: 'jwk',
  })
  // TODO: verify clientPubKey (e.g. check federation table + rights here)
  const { payload: payloadJWS } = await compactVerify(decryptedJWEPayload.jws, foreignPub)
  const receivedNonce = parseInt(new TextDecoder().decode(payloadJWS))

  if (nonce && receivedNonce !== nonce) {
    throw new Error('Could not verify nonce')
  }

  return { publicKey: decryptedJWEPayload.publicKey, nonce: receivedNonce }
}

export const generateToken = async (
  nonce: number,
  keyPair: { publicKey: Buffer; privateKey: Buffer },
  receiverPublicKey: Buffer,
) => {
  const receiverPublicKeyFixed = Buffer.from(receiverPublicKey.toString(), 'hex')
  const receiverPublicKeyFixedX = Buffer.alloc(crypto_scalarmult_curve25519_BYTES)
  crypto_sign_ed25519_pk_to_curve25519(receiverPublicKeyFixedX, receiverPublicKeyFixed)
  const key = createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: keyPair.publicKey.toString('base64url'),
      d: keyPair.privateKey.subarray(0, 32).toString('base64url'),
    },
    format: 'jwk',
  })
  const foreignPub = createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      x: receiverPublicKeyFixedX.toString('base64url'),
    },
    format: 'jwk',
  })
  const jws = await new CompactSign(
    new TextEncoder().encode(
      JSON.stringify({
        nonce: nonce.toString(),
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
