/// <reference types="node" />

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
export function fromString(str: string): bigint

/**
 * Converts a BigInt value to a string.
 * @param value - The BigInt value to convert
 * @param precision - The number of decimal places to include (max/default: 4)
 * @returns The string representation of the BigInt value
 */
export function toString(value: bigint, precision?: number): string
