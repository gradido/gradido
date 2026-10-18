// AI-GENERATED — not an architecture reference
import { DecryptError, HomeCommunityNative, X25519KeyPair } from 'shared-native'
import { Result } from '../errorTypes'

// The row stores the Ed25519 private key as libsodium (and the dht-node) does: seed || publicKey.
// HomeCommunityNative keeps the seed only.
const ED25519_SEED_SIZE = 32

/** The keys of the home community row, as the database holds them */
export type HomeCommunityKeys = {
  publicKey: Buffer
  privateKey: Buffer | null
  publicEncryptionKey: Buffer
  privateEncryptionKey: Buffer | null
}

/**
 * The home community as the process holds it, set once at start through AppContext: its
 * public keys, and its two key pairs on the native side. sign, verify, encrypt and decrypt are
 * one call each into HomeCommunityNative; the private keys stay there.
 */
export class HomeCommunity {
  public readonly publicKey: Buffer
  public readonly publicEncryptionKey: Buffer
  private readonly native: HomeCommunityNative

  /**
   * @throws Error for a row without both private keys - a home community always has them
   * @throws TypeError for a private key that does not belong to its public key
   */
  public constructor(keys: HomeCommunityKeys) {
    if (!keys.privateKey || !keys.privateEncryptionKey) {
      throw new Error('home community without private key, cannot sign or decrypt')
    }
    this.native = new HomeCommunityNative(
      keys.publicKey,
      keys.privateKey.subarray(0, ED25519_SEED_SIZE),
      keys.publicEncryptionKey,
      keys.privateEncryptionKey,
    )
    // copies, the row stays the caller's
    this.publicKey = Buffer.from(keys.publicKey)
    this.publicEncryptionKey = Buffer.from(keys.publicEncryptionKey)
  }

  /** @returns the 64 bytes detached Ed25519 signature */
  public sign(message: Uint8Array): Buffer {
    return this.native.sign(message)
  }

  /** @param signature - 64 bytes; another size throws, check it where it comes in */
  public verify(message: Uint8Array, signature: Uint8Array): boolean {
    return this.native.verify(message, signature)
  }

  /** @param recipient - with its public key only */
  public encrypt(payload: Uint8Array, recipient: X25519KeyPair): Buffer {
    return this.native.encrypt(payload, recipient)
  }

  /** @param sender - with its public key only */
  public decrypt(box: Uint8Array, sender: X25519KeyPair): Result<Buffer, DecryptError> {
    return this.native.decrypt(box, sender)
  }

  /** for a secret the home community keeps, e.g. in the database */
  public encryptSecret(payload: Uint8Array): Buffer {
    return this.native.encryptSecret(payload)
  }

  public decryptSecret(box: Uint8Array): Result<Buffer, DecryptError> {
    return this.native.decryptSecret(box)
  }
}
