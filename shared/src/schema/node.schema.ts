import { KeyObject } from 'node:crypto'
import * as v from 'valibot'
import { Duration } from '../data/Duration'
import { GradidoUnit } from '../data/GradidoUnit'

// The schemas that need Node (Buffer, node:crypto) or shared-native (GradidoUnit, Duration).
// They stand apart from base.schema.ts so that one stays loadable in a browser (../browser.ts).

const rawHexStringSchema = v.pipe(
  v.string(),
  v.hexadecimal('Invalid hex'),
  v.transform((hex) => hex.replace(/^0[hx]/, '')),
  v.check((hex) => hex.length % 2 === 0, 'Hex needs an even number of digits'),
)

/**
 * Bytes spelled as hex, the way the environment holds a key or a secret, into a Buffer.
 * valibot's `hexadecimal` lets a `0x`/`0h` prefix (lowercase) and an odd number of digits through, and
 * `Buffer.from(…, 'hex')` would swallow both silently -- stop at the `x`, drop the last
 * digit -- so both are handled here. Compose a length on top where the bytes have one:
 * `v.pipe(hexBytesSchema, v.length(16))`.
 */
export const hexBytesSchema = v.pipe(
  v.union([rawHexStringSchema, v.instance(Buffer)]),
  v.transform((hex) => {
    if (typeof hex === 'string') {
      return Buffer.from(hex, 'hex')
    }
    return hex
  }),
)

export const hexStringSchema = v.pipe(
  v.union([rawHexStringSchema, v.instance(Buffer)]),
  v.transform((hex) => {
    if (typeof hex === 'string') {
      return hex
    }
    return hex.toString('hex')
  }),
)

export const publicKeyHexStringSchema = v.pipe(hexStringSchema, v.length(64))
export type PublicKeyHex = v.InferOutput<typeof publicKeyHexStringSchema>

export const decaySchema = v.object({
  balance: v.instance(GradidoUnit),
  decay: v.instance(GradidoUnit),
  start: v.nullable(v.date()),
  end: v.nullable(v.date()),
  duration: v.nullable(v.instance(Duration)),
})

export type Decay = v.InferOutput<typeof decaySchema>

// TODO: actually check for valid ed25519 Keys/Key Pair
export const ed25519PublicKeySchema = v.pipe(
  hexBytesSchema,
  v.check((value) => value.length === 32, 'Expected 32 Bytes'),
)

export type PublicKey = v.InferOutput<typeof ed25519PublicKeySchema>

export const ed25519PrivateKeySchema = v.pipe(
  hexBytesSchema,
  v.check((value) => value.length === 64, 'Expected 64 Bytes'),
)

// X25519, the key pair of authenticated encryption (libsodium crypto_box): both keys raw 32 bytes
export const x25519PublicKeySchema = v.pipe(
  hexBytesSchema,
  v.check((value) => value.length === 32, 'Expected 32 Bytes'),
)

export const x25519PrivateKeySchema = v.pipe(
  hexBytesSchema,
  v.check((value) => value.length === 32, 'Expected 32 Bytes'),
)

// node:crypto KeyObject of any type (secret, public, private), narrow it where the type matters
export const nodeCryptoKeyObjectSchema = v.custom<KeyObject>((val) => val instanceof KeyObject)
// a Duration instance, a string like "10m" must be converted first: Duration.fromString
export const durationSchema = v.custom<Duration>((val) => val instanceof Duration)

export const gddAmountSchema = v.pipe(
  v.union([v.string(), v.instance(GradidoUnit)]),
  v.transform((input) => {
    if (typeof input === 'string') {
      return GradidoUnit.fromString(input)
    }
    return input
  }),
)
export const gddAmountStringSchema = v.pipe(
  v.union([v.pipe(v.string(), v.decimal()), v.instance(GradidoUnit)]),
  v.transform((input) => {
    if (typeof input === 'string') {
      return input
    }
    return input.toString(4)
  }),
)
