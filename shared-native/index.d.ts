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
