/// <reference types="node" />

/**
 * data/unit.h {@link include/gradido_blockchain_core/data/unit.h}
 */

/**
 * Returns the decay start time as a JavaScript Date object.
 */
export function getDecayStartTime(): Date
export function getDecayRespiteCent(): bigint

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
 * Derive an account child key from community seed and user UUID.
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

/**
 * A high-precision monotonic timer for simple performance measurements.
 *
 * This timer captures a reference point in time upon creation or reset, and allows
 * formatting the elapsed time since that reference point as a human-readable string.
 * It automatically selects the most appropriate time unit for the duration.
 *
 * @example
 * ```ts
 * const timer = new MonotonicTimer()
 *
 * // Perform some expensive operation...
 * doHeavyWork()
 *
 * console.log(timer) // "1.2345 ms" (implicitly calls toString)
 * console.log(timer.toString()) // "1.2345 ms"
 * console.log(`Time: ${timer}`) // "Time: 1.2345 ms"
 * ```
 */
export class MonotonicTimer {
  /**
   * Captures the current monotonic time as a reference point.
   *
   * The timer starts measuring from this moment. Subsequent calls to `toString()`
   * will report the elapsed time since this instant.
   */
  public constructor()

  /**
   * Resets the timer by capturing a new reference point.
   *
   * After calling `reset()`, subsequent calls to `toString()` will measure
   * elapsed time from this new moment. This is useful for measuring multiple
   * independent tasks with the same timer instance.
   *
   * @example
   * ```ts
   * const timer = new MonotonicTimer()
   * doTask1()
   * console.log(`Task 1: ${timer}`) // "Task 1: 42.1234 ms"
   *
   * timer.reset()
   * doTask2()
   * console.log(`Task 2: ${timer}`) // "Task 2: 15.6789 ms"
   * ```
   */
  public reset(): void

  /**
   * Formats the elapsed time since the last reset or creation as a human-readable string.
   *
   * The function automatically selects the most appropriate unit based on the duration.
   * Values are always formatted with 4 decimal places of precision.
   *
   * @returns A string representation of the elapsed time (e.g., `"123.4567 ms"`)
   *
   * @example
   * ```ts
   * const timer = new MonotonicTimer()
   * await new Promise(resolve => setTimeout(resolve, 150))
   *
   * console.log(timer.toString()) // "150.0234 ms"
   * console.log(`${timer}`)       // "150.0234 ms" (implicit conversion)
   * ```
   */
  public toString(): string
}
