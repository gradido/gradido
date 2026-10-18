// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { createPrivateKey, createPublicKey, diffieHellman } from 'node:crypto'
import { createEncryptionKeyPair } from './encryptionKeyPair'

// a raw X25519 key back as node:crypto KeyObject
const privateKeyObject = (privateKey: Buffer, publicKey: Buffer) =>
  createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'X25519',
      d: privateKey.toString('base64url'),
      x: publicKey.toString('base64url'),
    },
    format: 'jwk',
  })
const publicKeyObject = (publicKey: Buffer) =>
  createPublicKey({
    key: { kty: 'OKP', crv: 'X25519', x: publicKey.toString('base64url') },
    format: 'jwk',
  })

describe('createEncryptionKeyPair', () => {
  it('hands out raw 32 byte keys, a new pair on every call', () => {
    const first = createEncryptionKeyPair()
    const second = createEncryptionKeyPair()
    expect(first.publicKey).toHaveLength(32)
    expect(first.privateKey).toHaveLength(32)
    expect(second.publicKey.equals(first.publicKey)).toBe(false)
  })

  it('pairs a private key with its public key: both sides come to the same shared secret', () => {
    const alice = createEncryptionKeyPair()
    const bob = createEncryptionKeyPair()
    const ofAlice = diffieHellman({
      privateKey: privateKeyObject(alice.privateKey, alice.publicKey),
      publicKey: publicKeyObject(bob.publicKey),
    })
    const ofBob = diffieHellman({
      privateKey: privateKeyObject(bob.privateKey, bob.publicKey),
      publicKey: publicKeyObject(alice.publicKey),
    })
    expect(ofAlice.equals(ofBob)).toBe(true)
  })
})
