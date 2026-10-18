// AI-GENERATED — not an architecture reference
const { describe, it } = require('node:test')
const { strict: assert } = require('node:assert')
const nodeCrypto = require('node:crypto')
const { Ed25519KeyPair, X25519KeyPair } = require('../')

// RFC 8032, section 7.1, test 1
const rfcSeed = Buffer.from(
  '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
  'hex',
)
const rfcPublicKeyHex = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a'
const rfcEmptyMessageSignatureHex =
  'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b'

const message = Buffer.from('gradido')

describe('Ed25519KeyPair', () => {
  describe('generate', () => {
    it('derives the RFC 8032 key pair from its seed', () => {
      const keyPair = Ed25519KeyPair.generate(rfcSeed)
      assert.equal(keyPair.publicKeyToHex(), rfcPublicKeyHex)
      assert.equal(keyPair.hasPrivateKey(), true)
    })

    it('creates a different random key pair without seed', () => {
      const first = Ed25519KeyPair.generate()
      const second = Ed25519KeyPair.generate()
      assert.equal(first.hasPrivateKey(), true)
      assert.notEqual(first.publicKeyToHex(), second.publicKeyToHex())
    })

    it('throws for a seed that is not 32 bytes', () => {
      assert.throws(() => Ed25519KeyPair.generate(Buffer.alloc(31)), TypeError)
    })
  })

  describe('constructor', () => {
    const generated = Ed25519KeyPair.generate(rfcSeed)
    const { publicKey, privateKey } = generated.toBuffer()

    it('takes the private key as the 32 bytes seed', () => {
      const keyPair = new Ed25519KeyPair(publicKey, privateKey)
      assert.equal(keyPair.privateKeyToHex(), rfcSeed.toString('hex'))
      assert.equal(keyPair.sign(Buffer.alloc(0)).toString('hex'), rfcEmptyMessageSignatureHex)
    })

    it('throws for a private key of another public key', () => {
      const other = Ed25519KeyPair.generate().privateKeyToBuffer()
      assert.throws(() => new Ed25519KeyPair(publicKey, other), /does not belong to publicKey/)
    })

    it('throws for keys of the wrong size', () => {
      assert.throws(() => new Ed25519KeyPair(publicKey.subarray(0, 31)), TypeError)
      // libsodium's 64 bytes form, seed and public key
      assert.throws(
        () => new Ed25519KeyPair(publicKey, Buffer.concat([privateKey, publicKey])),
        /32 bytes, got 64/,
      )
    })
  })

  describe('sign and verify', () => {
    const keyPair = Ed25519KeyPair.generate(rfcSeed)
    const publicOnly = new Ed25519KeyPair(keyPair.publicKeyToBuffer())

    it('signs like RFC 8032', () => {
      assert.equal(keyPair.sign(Buffer.alloc(0)).toString('hex'), rfcEmptyMessageSignatureHex)
    })

    it('verifies with the public key alone', () => {
      assert.equal(publicOnly.verify(message, keyPair.sign(message)), true)
    })

    it('rejects an altered message or signature', () => {
      const signature = keyPair.sign(message)
      assert.equal(publicOnly.verify(Buffer.from('gradidO'), signature), false)
      signature[0] ^= 1
      assert.equal(publicOnly.verify(message, signature), false)
    })

    it('throws for a signature that is not 64 bytes', () => {
      assert.throws(
        () => publicOnly.verify(message, keyPair.sign(message).subarray(0, 63)),
        /64 bytes, got 63/,
      )
    })

    it('verifies a signature node:crypto made', () => {
      // PKCS#8 wrapping of a raw Ed25519 seed
      const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), rfcSeed])
      const nodeKey = nodeCrypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' })
      assert.equal(publicOnly.verify(message, nodeCrypto.sign(null, message, nodeKey)), true)
    })

    it('throws when signing without private key', () => {
      assert.throws(() => publicOnly.sign(message), /Needs a private key/)
    })
  })

  describe('exports', () => {
    const keyPair = Ed25519KeyPair.generate(rfcSeed)
    const publicOnly = new Ed25519KeyPair(keyPair.publicKeyToBuffer())

    it('exports both keys as buffers and as hex', () => {
      const buffers = keyPair.toBuffer()
      const hex = keyPair.toHex()
      assert.equal(buffers.publicKey.toString('hex'), rfcPublicKeyHex)
      assert.equal(buffers.privateKey.toString('hex'), rfcSeed.toString('hex'))
      assert.deepEqual(hex, { publicKey: rfcPublicKeyHex, privateKey: rfcSeed.toString('hex') })
      assert.equal(keyPair.privateKeyToHex(), hex.privateKey)
      assert.deepEqual(keyPair.publicKeyToBuffer(), buffers.publicKey)
    })

    it('hands out copies', () => {
      keyPair.publicKeyToBuffer().fill(0)
      assert.equal(keyPair.publicKeyToHex(), rfcPublicKeyHex)
    })

    it('exports null for a missing private key, and throws for it alone', () => {
      assert.equal(publicOnly.hasPrivateKey(), false)
      assert.deepEqual(publicOnly.toHex(), { publicKey: rfcPublicKeyHex, privateKey: null })
      assert.equal(publicOnly.toBuffer().privateKey, null)
      assert.throws(() => publicOnly.privateKeyToBuffer(), /Needs a private key/)
      assert.throws(() => publicOnly.privateKeyToHex(), /Needs a private key/)
    })
  })

  describe('equals', () => {
    const keyPair = Ed25519KeyPair.generate(rfcSeed)

    it('is true for the same public key, with or without private key', () => {
      assert.equal(keyPair.equals(new Ed25519KeyPair(keyPair.publicKeyToBuffer())), true)
      assert.equal(new Ed25519KeyPair(keyPair.publicKeyToBuffer()).equals(keyPair), true)
      assert.equal(keyPair.equals(keyPair), true)
    })

    it('is false for another public key', () => {
      assert.equal(keyPair.equals(Ed25519KeyPair.generate()), false)
    })

    it('throws for anything but an Ed25519KeyPair', () => {
      assert.throws(() => keyPair.equals(keyPair.publicKeyToBuffer()), TypeError)
      assert.throws(() => keyPair.equals(X25519KeyPair.generate()), TypeError)
      assert.throws(() => keyPair.equals(), TypeError)
    })
  })

  it('is not an X25519KeyPair', () => {
    assert.equal(Ed25519KeyPair.generate() instanceof X25519KeyPair, false)
  })
})
