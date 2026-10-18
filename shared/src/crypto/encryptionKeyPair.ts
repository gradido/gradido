// AI-GENERATED — not an architecture reference
import { generateKeyPairSync } from 'node:crypto'

/**
 * A new X25519 key pair for authenticated encryption, as raw 32 bytes each - the form libsodium's
 * crypto_box takes them in. Migration 0163 holds a frozen copy for the home communities it fills.
 */
export function createEncryptionKeyPair(): { publicKey: Buffer; privateKey: Buffer } {
  const jwk = generateKeyPairSync('x25519').privateKey.export({ format: 'jwk' })
  if (!jwk.x || !jwk.d) {
    throw new Error('X25519 key exported without its raw parts')
  }
  return { publicKey: Buffer.from(jwk.x, 'base64url'), privateKey: Buffer.from(jwk.d, 'base64url') }
}
