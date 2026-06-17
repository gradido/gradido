/**
 * describe from lib exported functions with args and return types
 * C function declarations for  grdd_unit_* are found in
 * {@link include/gradido_blockchain_core/data/unit.h}
 */

import { ptr, read } from 'bun:ffi'
import { blockchain_core } from './library'

const INT64_MAX = (1n << 63n) - 1n

/**
 * High-level flow if C functions expect a ptr (*) as argument:
 * 1. Allocate memory in JavaScript (TypedArray / Buffer)
 * 2. Pass a pointer to that memory into a C function
 * 3. Let the C function write data into that memory
 * 4. Read the result back into JavaScript
 */

export function getDecayStartTime(): Date {
  return new Date(Number(blockchain_core.symbols.grdd_unit_decay_start_time()) * 1000)
}

export function getDecayRespiteCent(): bigint {
  return blockchain_core.symbols.grdc_decay_respite_cent()
}

export function calculateDecay(value: bigint, seconds: bigint): bigint {
  if (value < 0) {
    throw new Error('[calculateDecay] First Argument must be >= 0')
  }
  const result = blockchain_core.symbols.grdd_unit_calculate_decay(value, seconds)
  if (result === INT64_MAX) {
    throw new Error('[calculateDecay] Decay calculation probably resulted in overflow')
  }
  return result
}

export function gradidoUnitFromString(str: string): bigint {
  // ptr() creates a C pointer from JavaScript TypedArray
  // This pointer represents a memory address that C functions can write to
  // The Int8Array(8) allocates 8 bytes for a 64-bit integer result
  const resultBufferPtr = ptr(new Int8Array(8))

  // C expects null-terminated strings, but JavaScript strings don't have null terminators
  // Without the '\0', C would read past the end of the string into random memory.
  // We create a Buffer with explicit null termination for C compatibility
  const strBuffer = Buffer.from(str + '\0', 'utf8')

  // grdd_unit_from_string writes the parsed result to the memory location pointed to by resultBufferPtr
  // The function returns false if parsing fails
  if (!blockchain_core.symbols.grdd_unit_from_string(resultBufferPtr, strBuffer)) {
    throw new Error(
      "[gradidoUnitFromString] Invalid unit string. Must be a decimal with up to 4 fractional digits, integer part between -922'337'203'685'476 and 922'337'203'685'476.",
    )
  }

  // read.i64() reads 64-bit integer data from the C pointer back into JavaScript BigInt
  // This retrieves the value that the C function wrote to our allocated memory
  return read.i64(resultBufferPtr)
}

export function gradidoUnitToString(value: bigint, precision?: number): string {
  if (value > 9223372036854775807n || value < -9223372036854775807n) {
    throw new Error('[gradidoUnitToString] BigInt value is too large to fit in grdd_unit')
  }
  if (precision !== undefined && (precision < 0 || precision > 4)) {
    throw new Error('[gradidoUnitToString] Precision must be between 0 and 4')
  }

  // Allocate 32 bytes for the C string output buffer
  // Maximal length for a 64-bit integer with 4 decimal places should be 22 characters,
  // but we allocate 32 bytes to be safe (22 + 1 for null termination + some buffer)
  // C strings are null-terminated, so we need enough space for the formatted result
  const resultBuffer = new Uint8Array(32)

  // ptr() converts the Uint8Array to a C pointer that the native function can write to
  // The pointer represents the starting memory address of our buffer
  const resultBufferPtr = ptr(resultBuffer)

  // grdd_unit_to_string writes the formatted string to our buffer and returns the string length
  // The function takes: buffer pointer, buffer size, value to format, and precision
  // Returns the number of bytes written (excluding null terminator)
  const result = blockchain_core.symbols.grdd_unit_to_string(
    resultBufferPtr,
    32,
    value,
    precision ?? 4,
  )
  if (result < 0) {
    throw new Error('[gradidoUnitToString] Rounding failed (overflow)')
  }

  // Convert the buffer back to a JavaScript string and slice to the actual length
  // The C function wrote the string data to the memory location pointed to by resultBufferPtr
  return Buffer.from(resultBuffer).toString('utf8').slice(0, result)
}

export function toDecimalPlaces(value: bigint, places: number): bigint {
  if (places < 0 || places > 4) {
    throw new Error('[toDecimalPlaces] Places must be between 0 and 4')
  }
  if (value > 9223372036854775807n || value < -9223372036854775807n) {
    throw new Error('[toDecimalPlaces] BigInt value is too large to fit in grdd_unit')
  }

  // Allocate 8 bytes for the 64-bit integer result
  const resultBuffer = new Int8Array(8)
  // ptr() creates a C pointer to this memory location
  const resultBufferPtr = ptr(resultBuffer)

  // grdd_unit_round_to_precision writes the rounded result to the memory pointed to by resultBufferPtr
  // Returns false if rounding fails (overflow)
  if (!blockchain_core.symbols.grdd_unit_round_to_precision(resultBufferPtr, value, places)) {
    throw new Error('[toDecimalPlaces] Rounding failed (overflow)')
  }

  // read.i64() reads the 64-bit integer from the C pointer back into JavaScript BigInt
  // This retrieves the rounded value that the C function wrote to our buffer
  return read.i64(resultBufferPtr)
}
