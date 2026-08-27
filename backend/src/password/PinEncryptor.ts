// AI-GENERATED — not an architecture reference
import {
  crypto_generichash,
  crypto_generichash_BYTES,
  crypto_shorthash_KEYBYTES,
} from 'sodium-native'
import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'

/**
 * Derives the stored value for a thank-you-card PIN: keyed BLAKE2b over salt, app secret
 * and PIN, keyed with the server key, cut to the same 64 bit shape the old derivation
 * produced -- so the column and every comparison stay as they are.
 *
 * ## Why this is deliberately NOT the password KDF (Dario, 20.08.2026)
 *
 * The password path is argon2id with 32 MiB per call, queued in the same worker pool the
 * login waits in. That cost is the point for a password -- and pointless for a PIN: a six
 * digit space is brute-forced in minutes whatever the KDF costs, IF an attacker holds both
 * the database and the environment. Without the environment, this derivation is just as
 * unreadable as the old one: the server key and the app secret never leave the process.
 * The PIN's real protection is the three-attempt block, which is enforced server-side and
 * tested. What the expensive KDF actually did was let a market day of card payments fill
 * the login's queue.
 *
 * ⛔ The parts and their order are load-bearing: a value derived differently will not
 * match any stored hash, and there is no way to tell that apart from a wrong PIN. The
 * regression test pins the exact output for fixed inputs -- if it falls, every stored
 * KEYED_HASH pin on every server would stop matching. Do not "improve" this in place;
 * that is what `pin_derivation` versions are for.
 */
export const deriveKeyedPinKeyFunc = (
  salt: string,
  pin: string,
  appSecret: Buffer,
  serverKey: Buffer,
): bigint => {
  const out = Buffer.alloc(crypto_generichash_BYTES)
  const message = Buffer.concat([Buffer.from(salt, 'utf8'), appSecret, Buffer.from(pin, 'utf8')])
  crypto_generichash(out, message, serverKey)
  return out.readBigUInt64LE()
}

export const deriveKeyedPinKey = (salt: string, pin: string): bigint => {
  const serverKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')
  if (serverKey.length !== crypto_shorthash_KEYBYTES) {
    throw new LogError('ServerKey has an invalid size', serverKey.length)
  }
  return deriveKeyedPinKeyFunc(salt, pin, Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex'), serverKey)
}
