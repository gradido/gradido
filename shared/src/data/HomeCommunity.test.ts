// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { Ed25519KeyPair, X25519KeyPair } from 'shared-native'
import { HomeCommunity, HomeCommunityKeys } from './HomeCommunity'

const signKeys = Ed25519KeyPair.generate().toBuffer()
const encryptionKeys = X25519KeyPair.generate().toBuffer()
// the row as the dht-node writes it: privateKey = seed || publicKey
const row: HomeCommunityKeys = {
  publicKey: signKeys.publicKey,
  privateKey: Buffer.concat([signKeys.privateKey as Buffer, signKeys.publicKey]),
  publicEncryptionKey: encryptionKeys.publicKey,
  privateEncryptionKey: encryptionKeys.privateKey,
}
const message = Buffer.from('gradido')

describe('HomeCommunity', () => {
  it('signs with the seed of the stored private key', () => {
    const community = new HomeCommunity(row)
    const signature = community.sign(message)
    expect(new Ed25519KeyPair(signKeys.publicKey).verify(message, signature)).toBe(true)
    expect(community.verify(message, signature)).toBe(true)
  })

  it('encrypts and decrypts with a peer', () => {
    const community = new HomeCommunity(row)
    const peer = X25519KeyPair.generate()
    const peerPublicOnly = new X25519KeyPair(peer.publicKeyToBuffer())
    const homePublicOnly = new X25519KeyPair(community.publicEncryptionKey)

    const box = community.encrypt(message, peerPublicOnly)
    expect(peer.decrypt(box, homePublicOnly)).toEqual({ success: true, value: message })
    expect(community.decrypt(peer.encrypt(message, homePublicOnly), peerPublicOnly)).toEqual({
      success: true,
      value: message,
    })
    expect(community.decryptSecret(community.encryptSecret(message))).toEqual({
      success: true,
      value: message,
    })
  })

  it('keeps copies of the public keys, the row stays the caller’s', () => {
    const copy = { ...row, publicKey: Buffer.from(row.publicKey) }
    const community = new HomeCommunity(copy)
    copy.publicKey.fill(0)
    expect(community.publicKey).toEqual(signKeys.publicKey)
  })

  it('throws for a row without private keys', () => {
    expect(() => new HomeCommunity({ ...row, privateKey: null })).toThrow('without private key')
    expect(() => new HomeCommunity({ ...row, privateEncryptionKey: null })).toThrow(
      'without private key',
    )
  })

  it('throws for keys that do not belong together', () => {
    const other = Ed25519KeyPair.generate().toBuffer()
    expect(() => new HomeCommunity({ ...row, publicKey: other.publicKey })).toThrow(
      'does not belong to publicKey',
    )
  })
})
