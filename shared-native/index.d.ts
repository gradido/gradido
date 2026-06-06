/// <reference types="node" />

/**
 * data/unit.h {@link include/gradido_blockchain_core/data/unit.h}
 */

/**
 * Returns the decay start time as a JavaScript Date object.
 */
export function getDecayStartTime(): Date

/**
 * Calculates decay for a given BigInt value over a duration in seconds.
 * @param value - The BigInt value to decay (in gdd units)
 * @param seconds - The duration in seconds
 * @returns The decayed BigInt value (in gdd units)
 */
export function calculateDecay(value: bigint, seconds: bigint): bigint

/**
 * Converts a string to a BigInt value.
 * @param str - The string to convert
 * @returns The BigInt value
 */
export function gradidoUnitFromString(str: string): bigint

/**
 * Converts a BigInt value to a string.
 * @param value - The BigInt value to convert
 * @param precision - The number of decimal places to include (max/default: 4)
 * @returns The string representation of the BigInt value
 */
export function gradidoUnitToString(value: bigint, precision?: number): string

/**
 * Rounds gradido units to a specified number of decimal places.
 * @param value - The BigInt value to round (in gdd units)
 * @param places - The number of decimal places to round to
 * @returns The rounded BigInt value (in gdd units)
 */
export function toDecimalPlaces(value: bigint, places: number): bigint

/**
 * C function declarations for grdu_duration_string are found in
 * {@link include/gradido_blockchain_core/data/duration.h}
 */

/**
 * Converts a duration in nanoseconds to a string (for debugging purposes).
 * @param duration - The duration in nanoseconds
 * @param precision - The number of decimal places to include (max/default: 4)
 * @returns The string representation of the duration
 */
export function durationToString(duration: bigint, precision?: number): string

/**
 * C function declarations for grdc_sign_key_pair are found in
 * {@link include/gradido_blockchain_core/crypto/sign.h}
 */

export function signKeyPairGenerateFromSeed(seed: Uint8Array): Uint8Array

/**
 * @param index need to be >= 0x80000000 (hardend key)
 */
export function signKeyPairDerive(parentKeyPair: Uint8Array, index: number): Uint8Array

export function signKeyPairDeriveUuid(parentKeyPair: Uint8Array, uuid: Uint8Array): Uint8Array

/**
 * @brief Derive an account child key from community seed and user UUID.
 *
 * Performs a full derivation path starting from the community root seed,
 * deriving through the user UUID to arrive at a specific account key. The
 * account_index selects the account within the user's hierarchy, starting
 * from 1. This combines community, user, and account context into a single
 * deterministic key.
 *
 * @param communitySeed - 64-byte community root seed in hex
 * @param userUuid - user uuid in raw uuid form
 * @param accountNumber - account number of user, starting with 1 (contribution account), < 0x80000000
 * @returns Buffer containing 32 Bytes seed, 32 Bytes Public Key which together are the private Key and 32 Bytes chain code needed for key derivations
 */
export function signKeyPairDeriveAccountFromCommunity(
  communitySeed: Uint8Array,
  userUuid: Uint8Array,
  accountNumber: number = 1,
): Uint8Array

/**
 * C function declarations for grdc_hash are found in
 * {@link include/gradido_blockchain_core/crypto/hash.h}
 */

export function hashGeneric(data: Uint8Array): Uint8Array
