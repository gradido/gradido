// AI-GENERATED — not an architecture reference
import { AppContext } from 'shared'

/**
 * Derives the stored value for a thank-you-card PIN: keyed BLAKE2b over salt, app secret
 * and PIN, keyed with the server key, cut to the same 64 bit shape the old derivation
 * produced -- so the column and every comparison stay as they are. The derivation itself
 * runs in the native app context (shared-native/napi/passwordHashing.cpp, `derivePinKey`),
 * where the secrets live.
 *
 * ## Why this is deliberately NOT the password KDF (Dario, 20.08.2026)
 *
 * The password path is argon2id with 32 MiB per call, queued for the hashing threads the
 * login waits on. That cost is the point for a password -- and pointless for a PIN: a six
 * digit space is brute-forced in minutes whatever the KDF costs, IF an attacker holds both
 * the database and the environment. Without the environment, this derivation is just as
 * unreadable as the old one: the server key and the app secret never leave the process.
 * The PIN's real protection is the three-attempt block, which is enforced server-side and
 * tested. What the expensive KDF actually did was let a market day of card payments fill
 * the login's queue.
 *
 * ⛔ The parts and their order are load-bearing: a value derived differently will not
 * match any stored hash, and there is no way to tell that apart from a wrong PIN. The
 * regression test in shared-native pins the exact output for fixed inputs -- if it falls,
 * every stored KEYED_HASH pin on every server would stop matching. Do not "improve" this in
 * place; that is what `pin_derivation` versions are for.
 */
export const deriveKeyedPinKey = (salt: string, pin: string): bigint => {
  return AppContext.getInstance().derivePinKey(salt, pin)
}
