// AI-GENERATED — not an architecture reference
const { describe, it } = require('node:test')
const { strict: assert } = require('node:assert')
const nodeCrypto = require('node:crypto')
const { Ed25519KeyPair, X25519KeyPair } = require('../')

// generate(Buffer.alloc(32, 1)) and generate(Buffer.alloc(32, 2))
const alice = {
  publicKey: '1b1b58dd50ea14b60da17b790cd02754d970c9bab864ebb3c0f3016fe51d3f57',
  privateKey: '5ce86efb75fa4e2c410f46e16de9f6acae1a1703528651b69bc176c088bef3ee',
}
const bob = {
  publicKey: '60346e7c911a5f6ba154129174cafe75b294ac3bbd5549632f48cec6266f8410',
  privateKey: 'aa3c626bc9c38c8c201878ebb1d5b0b50ac40e8986c78793db1d4ef369fca1ce',
}
// 'gradido' encrypted with an earlier build; stored ciphertexts have to stay readable
const aliceToBobBox =
  '01b09a5cfd0fee91bf29da477e4f8883aa98663af66f386dcdf5744392aaf40aa38a14bfd532ff0362f07a567e88e372'
const aliceSecret =
  '02539ab8119db1815847a7b33b554b91724fb43cc09e67fa58e15251320fa8007aae4c50de7d57c739869f08bcf6d4dd'

const message = Buffer.from('gradido')

const fromHex = ({ publicKey, privateKey }) =>
  new X25519KeyPair(
    Buffer.from(publicKey, 'hex'),
    privateKey ? Buffer.from(privateKey, 'hex') : undefined,
  )
const publicOf = (keyPair) => new X25519KeyPair(keyPair.publicKeyToBuffer())

describe('X25519KeyPair', () => {
  describe('generate', () => {
    it('derives the same key pair from the same seed', () => {
      assert.deepEqual(X25519KeyPair.generate(Buffer.alloc(32, 1)).toHex(), alice)
    })

    it('creates a different random key pair without seed', () => {
      const first = X25519KeyPair.generate()
      assert.equal(first.hasPrivateKey(), true)
      assert.notEqual(first.publicKeyToHex(), X25519KeyPair.generate().publicKeyToHex())
    })

    it('throws for a seed that is not 32 bytes', () => {
      assert.throws(() => X25519KeyPair.generate(Buffer.alloc(16)), TypeError)
    })
  })

  describe('constructor', () => {
    it('takes a key pair node:crypto made', () => {
      const jwk = nodeCrypto.generateKeyPairSync('x25519').privateKey.export({ format: 'jwk' })
      const keyPair = new X25519KeyPair(
        Buffer.from(jwk.x, 'base64url'),
        Buffer.from(jwk.d, 'base64url'),
      )
      assert.equal(keyPair.publicKeyToHex(), Buffer.from(jwk.x, 'base64url').toString('hex'))
    })

    it('throws for a private key of another public key', () => {
      assert.throws(
        () => fromHex({ publicKey: alice.publicKey, privateKey: bob.privateKey }),
        /does not belong to publicKey/,
      )
    })

    it('throws for keys of the wrong size', () => {
      assert.throws(() => new X25519KeyPair(Buffer.alloc(33)), TypeError)
      assert.throws(
        () => new X25519KeyPair(Buffer.from(alice.publicKey, 'hex'), Buffer.alloc(64)),
        TypeError,
      )
    })
  })

  describe('encrypt and decrypt', () => {
    const aliceKeys = fromHex(alice)
    const bobKeys = fromHex(bob)

    it('decrypts what the other side encrypted', () => {
      const box = aliceKeys.encrypt(message, publicOf(bobKeys))
      assert.equal(box.length, message.length + 41)
      assert.equal(box[0], 1)
      assert.deepEqual(bobKeys.decrypt(box, publicOf(aliceKeys)), { success: true, value: message })
    })

    it('still decrypts a ciphertext of an earlier build', () => {
      const result = bobKeys.decrypt(Buffer.from(aliceToBobBox, 'hex'), publicOf(aliceKeys))
      assert.deepEqual(result, { success: true, value: message })
    })

    it('uses a fresh nonce each time', () => {
      const bobPublic = publicOf(bobKeys)
      assert.notDeepEqual(
        aliceKeys.encrypt(message, bobPublic),
        aliceKeys.encrypt(message, bobPublic),
      )
    })

    it('fails for another sender', () => {
      const box = aliceKeys.encrypt(message, publicOf(bobKeys))
      const result = bobKeys.decrypt(box, publicOf(X25519KeyPair.generate()))
      assert.equal(result.success, false)
      assert.equal(result.error.name, 'DecryptFailed')
    })

    it('fails for an altered ciphertext', () => {
      const box = aliceKeys.encrypt(message, publicOf(bobKeys))
      box[box.length - 1] ^= 1
      assert.equal(bobKeys.decrypt(box, publicOf(aliceKeys)).error.name, 'DecryptFailed')
    })

    it('fails for a ciphertext too short to be one', () => {
      assert.equal(
        bobKeys.decrypt(Buffer.alloc(40, 1), publicOf(aliceKeys)).error.name,
        'MalformedCiphertext',
      )
    })

    it('fails for a ciphertext of encryptSecret', () => {
      assert.equal(
        bobKeys.decrypt(bobKeys.encryptSecret(message), publicOf(aliceKeys)).error.name,
        'UnknownVersion',
      )
    })

    it('throws for a peer that carries a private key', () => {
      assert.throws(() => aliceKeys.encrypt(message, bobKeys), /only a public key/)
      const box = aliceKeys.encrypt(message, publicOf(bobKeys))
      assert.throws(() => bobKeys.decrypt(box, aliceKeys), /only a public key/)
    })

    it('throws for a peer that is not an X25519KeyPair', () => {
      const ed25519 = new Ed25519KeyPair(Buffer.from(bob.publicKey, 'hex'))
      assert.throws(() => aliceKeys.encrypt(message, ed25519), /to be an X25519KeyPair/)
      assert.throws(
        () => aliceKeys.encrypt(message, { publicKey: bob.publicKey }),
        /to be an X25519KeyPair/,
      )
    })

    it('throws without own private key', () => {
      assert.throws(
        () => publicOf(aliceKeys).encrypt(message, publicOf(bobKeys)),
        /Needs a private key/,
      )
      assert.throws(
        () => publicOf(bobKeys).decrypt(Buffer.alloc(41), publicOf(aliceKeys)),
        /Needs a private key/,
      )
    })
  })

  describe('encryptSecret and decryptSecret', () => {
    const aliceKeys = fromHex(alice)

    it('decrypts its own secret, also after the keys went through the database', () => {
      const box = aliceKeys.encryptSecret(message)
      assert.equal(box.length, message.length + 41)
      assert.equal(box[0], 2)
      assert.deepEqual(fromHex(aliceKeys.toHex()).decryptSecret(box), {
        success: true,
        value: message,
      })
    })

    it('still decrypts a secret of an earlier build', () => {
      assert.deepEqual(aliceKeys.decryptSecret(Buffer.from(aliceSecret, 'hex')), {
        success: true,
        value: message,
      })
    })

    it('handles an empty payload', () => {
      assert.deepEqual(aliceKeys.decryptSecret(aliceKeys.encryptSecret(Buffer.alloc(0))), {
        success: true,
        value: Buffer.alloc(0),
      })
    })

    it('fails for the secret of another key pair', () => {
      assert.equal(
        fromHex(bob).decryptSecret(aliceKeys.encryptSecret(message)).error.name,
        'DecryptFailed',
      )
    })

    it('fails for a ciphertext of encrypt', () => {
      const box = aliceKeys.encrypt(message, new X25519KeyPair(Buffer.from(bob.publicKey, 'hex')))
      assert.equal(aliceKeys.decryptSecret(box).error.name, 'UnknownVersion')
    })

    it('fails for a ciphertext too short to be one', () => {
      assert.equal(aliceKeys.decryptSecret(Buffer.from([2])).error.name, 'MalformedCiphertext')
    })

    it('throws without private key', () => {
      assert.throws(() => publicOf(aliceKeys).encryptSecret(message), /Needs a private key/)
      assert.throws(
        () => publicOf(aliceKeys).decryptSecret(Buffer.from(aliceSecret, 'hex')),
        /Needs a private key/,
      )
    })
  })

  describe('exports', () => {
    it('exports both keys as copies, null for a missing private key', () => {
      const keyPair = fromHex(alice)
      assert.deepEqual(keyPair.toHex(), alice)
      assert.equal(keyPair.toBuffer().privateKey.toString('hex'), alice.privateKey)
      assert.equal(keyPair.privateKeyToHex(), alice.privateKey)
      assert.equal(keyPair.publicKeyToBuffer().toString('hex'), alice.publicKey)
      keyPair.privateKeyToBuffer().fill(0)
      assert.equal(keyPair.privateKeyToHex(), alice.privateKey)

      const publicOnly = publicOf(keyPair)
      assert.deepEqual(publicOnly.toBuffer(), {
        publicKey: Buffer.from(alice.publicKey, 'hex'),
        privateKey: null,
      })
      assert.throws(() => publicOnly.privateKeyToBuffer(), /Needs a private key/)
    })
  })
})
