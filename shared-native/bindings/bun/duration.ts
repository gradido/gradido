/**
 * C function declarations for  grdu_duration_string are found in
 * {@link include/gradido_blockchain_core/data/duration.h}
 */

import { ptr } from 'bun:ffi'
import { blockchain_core } from './library'

export function durationToString(duration: bigint, precision?: number): string {
  // Allocate 32 bytes for the C string output buffer
  const resultBuffer = new Uint8Array(32)

  // ptr() converts the Uint8Array to a C pointer that the native function can write to
  // This pointer represents the memory address where the formatted duration string will be stored
  const resultBufferPtr = ptr(resultBuffer)

  // grdu_duration_string writes the formatted duration string to our buffer
  // Returns the length of the written string
  const result = blockchain_core.symbols.grdu_duration_string(
    resultBufferPtr,
    32,
    duration,
    precision ?? 2,
  )

  if (result < 0) {
    throw new Error('[durationToString] Duration string conversion failed')
  }

  // Convert the buffer back to JavaScript string and slice to actual length
  // The C function wrote the string data to the memory location pointed to by resultBufferPtr
  return Buffer.from(resultBuffer).toString('utf8').slice(0, result)
}
