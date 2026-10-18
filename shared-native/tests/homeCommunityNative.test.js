// AI-GENERATED — not an architecture reference
const { describe, it } = require('node:test')
const { strict: assert } = require('node:assert')
const { Ed25519KeyPair, HomeCommunityNative, X25519KeyPair } = require('../')

const signKeys = Ed25519KeyPair.generate().toBuffer()
const encryptionKeys = X25519KeyPair.generate().toBuffer()
const create = (sign = signKeys, encryption = encryptionKeys) =>
  new HomeCommunityNative(
    sign.publicKey,
    sign.privateKey,
    encryption.publicKey,
    encryption.privateKey,
  )
const home = create()
// the same keys as plain key pairs, to compare with
const signKeyPair = new Ed25519KeyPair(signKeys.publicKey, signKeys.privateKey)
const encryptionKeyPair = new X25519KeyPair(encryptionKeys.publicKey, encryptionKeys.privateKey)
const message = Buffer.from('gradido')

describe('HomeCommunityNative', () => {
  describe('constructor', () => {
    it('throws for a private key of another public key', () => {
      const other = Ed25519KeyPair.generate().toBuffer()
      assert.throws(
        () => create({ publicKey: signKeys.publicKey, privateKey: other.privateKey }),
        /privateKey does not belong to publicKey/,
      )
      const otherEncryption = X25519KeyPair.generate().toBuffer()
      assert.throws(
        () =>
          create(signKeys, {
            publicKey: encryptionKeys.publicKey,
            privateKey: otherEncryption.privateKey,
          }),
        /privateEncryptionKey does not belong to publicEncryptionKey/,
      )
    })

    it('needs all four keys, 32 bytes each', () => {
      assert.throws(
        () => new HomeCommunityNative(signKeys.publicKey, signKeys.privateKey),
        /four arguments/,
      )
      assert.throws(
        () => create(signKeys, { ...encryptionKeys, privateKey: null }),
        /privateEncryptionKey to be a Uint8Array/,
      )
      assert.throws(
        () => create({ ...signKeys, publicKey: signKeys.publicKey.subarray(0, 31) }),
        /publicKey to be 32 bytes, got 31/,
      )
    })
  })

  describe('sign and verify', () => {
    it('signs as an Ed25519KeyPair with the same keys does', () => {
      // Ed25519 signatures are deterministic
      assert.deepEqual(home.sign(message), signKeyPair.sign(message))
    })

    it('verifies its own signature, and refuses another message', () => {
      const signature = home.sign(message)
      assert.equal(home.verify(message, signature), true)
      assert.equal(home.verify(Buffer.from('gradidO'), signature), false)
    })

    it('throws for a signature that is not 64 bytes', () => {
      assert.throws(
        () => home.verify(message, home.sign(message).subarray(0, 63)),
        /HomeCommunityNative.verify\] Expected signature to be 64 bytes, got 63/,
      )
    })
  })

  describe('encrypt and decrypt', () => {
    const peer = X25519KeyPair.generate()
    const peerPublicOnly = new X25519KeyPair(peer.publicKeyToBuffer())
    const homePublicOnly = new X25519KeyPair(encryptionKeys.publicKey)

    it('encrypts for a peer, who decrypts it with the home public key', () => {
      const box = home.encrypt(message, peerPublicOnly)
      assert.deepEqual(peer.decrypt(box, homePublicOnly), { success: true, value: message })
    })

    it('decrypts what a peer encrypted for it', () => {
      const box = peer.encrypt(message, homePublicOnly)
      assert.deepEqual(home.decrypt(box, peerPublicOnly), { success: true, value: message })
    })

    it('refuses a peer with private key', () => {
      assert.throws(() => home.encrypt(message, peer), /recipient to carry only a public key/)
    })

    it('answers a malformed ciphertext as failure', () => {
      const result = home.decrypt(Buffer.alloc(3), peerPublicOnly)
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'MalformedCiphertext')
    })
  })

  describe('encryptSecret and decryptSecret', () => {
    it('decrypts its own secret', () => {
      assert.deepEqual(home.decryptSecret(home.encryptSecret(message)), {
        success: true,
        value: message,
      })
    })

    it('shares its secrets with an X25519KeyPair of the same keys', () => {
      assert.deepEqual(encryptionKeyPair.decryptSecret(home.encryptSecret(message)), {
        success: true,
        value: message,
      })
      assert.deepEqual(home.decryptSecret(encryptionKeyPair.encryptSecret(message)), {
        success: true,
        value: message,
      })
    })

    it('refuses the secret of other keys', () => {
      const other = X25519KeyPair.generate().encryptSecret(message)
      assert.equal(home.decryptSecret(other).error?.name, 'DecryptFailed')
    })
  })
})
