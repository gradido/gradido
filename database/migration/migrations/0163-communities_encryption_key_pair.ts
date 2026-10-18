// `communities.public_encryption_key` and `communities.private_encryption_key`: an X25519 key
// pair for authenticated encryption (libsodium crypto_box), raw 32 bytes each. It is to take over
// from the JWT key pair (0091) what that one does between communities; until every use has moved,
// both stand side by side.
//
// The public key is NOT NULL: every community has one. The home community gets its pair here,
// as dht-node gives one to a home community it creates. The private key stays nullable, a
// foreign community's private key is not ours to know.
//
// The foreign communities are deleted. They have no encryption key to fill in, and they come
// back with one: dht-node announces them again, the validation asks each for its signed
// community infos and inserts it anew. Nothing refers to a communities row by its id; `users`
// refers by community_uuid, and a community comes back under its uuid. A downgrade does not
// bring them back either, they come back through the dht the same way.
//
// No UNIQUE key, unlike `public_key`: the encryption key names no community, a community is
// found by its signing key. Someone announcing the public encryption key of another gains
// nothing without the private key that belongs to it.
//
// The key pair is made with node:crypto, a frozen copy of shared `createEncryptionKeyPair`.
//
// `IF NOT EXISTS` / `IF EXISTS`: DDL does not roll back.
import { generateKeyPairSync } from 'node:crypto'

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // nullable first, NOT NULL once every remaining row has its key
  await queryFn(`
    ALTER TABLE communities
      ADD COLUMN IF NOT EXISTS public_encryption_key binary(32) DEFAULT NULL AFTER private_jwt_key,
      ADD COLUMN IF NOT EXISTS private_encryption_key binary(32) DEFAULT NULL AFTER public_encryption_key`)

  await queryFn('DELETE FROM communities WHERE `foreign` = 1')

  const homeCommunities = await queryFn(
    'SELECT c.id FROM communities AS c WHERE c.public_encryption_key IS NULL',
  )
  for (const { id } of homeCommunities as { id: number }[]) {
    const jwk = generateKeyPairSync('x25519').privateKey.export({ format: 'jwk' })
    if (!jwk.x || !jwk.d) {
      throw new Error('0163: X25519 key exported without its raw parts')
    }
    await queryFn(
      'UPDATE communities SET public_encryption_key = ?, private_encryption_key = ? WHERE id = ?',
      [Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.d, 'base64url'), id],
    )
  }

  await queryFn('ALTER TABLE communities MODIFY public_encryption_key binary(32) NOT NULL')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    ALTER TABLE communities
      DROP COLUMN IF EXISTS private_encryption_key,
      DROP COLUMN IF EXISTS public_encryption_key`)
}
