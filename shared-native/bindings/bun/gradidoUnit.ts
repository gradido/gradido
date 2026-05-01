// Bun FFI (Foreign Function Interface) enables high-performance calls to native C libraries from JavaScript
// It works by dynamically loading native libraries and generating JIT-compiled bindings
// Key concepts:
// - dlopen: loads native library and exposes symbols (functions)
// - ptr: converts JavaScript TypedArrays/ArrayBuffers to C pointers (memory addresses)
// - read: reads data from C pointers back into JavaScript types
// - FFIType: defines type mappings between JS and C types

import { dlopen, FFIType, ptr, read } from 'bun:ffi'
import path from 'path'
import { getCoreFileName } from '../../build_helper/host_configuration'

const { i64, u64, i32, bool, cstring, pointer, u8 } = FFIType

const filePath = path.resolve(__dirname, `../../build/${getCoreFileName()}`)
// direct importing c library via ffi, without nodejs addon wrapper
const {
  symbols: {
    grdd_unit_decay_start_time,
    grdd_unit_calculate_decay,
    grdd_unit_from_string,
    grdd_unit_to_string,
    grdd_unit_round_to_precision,
    grdu_duration_string,
  },
} = dlopen(filePath, {
  /**
   * describe from lib exported functions with args and return types
   * C function declarations for  grdd_unit_* are found in
   * {@link include/gradido_blockchain_core/data/unit.h}
   */
  grdd_unit_decay_start_time: {
    returns: i64,
    args: [],
  },
  grdd_unit_calculate_decay: {
    returns: i64,
    args: [i64, i64],
  },
  grdd_unit_from_string: {
    returns: bool,
    args: [pointer, cstring],
  },
  grdd_unit_to_string: {
    returns: i32,
    args: [cstring, u64, i64, u8],
  },
  grdd_unit_round_to_precision: {
    returns: bool,
    args: [pointer, i64, u8],
  },
  /**
   * C function declarations for  grdu_duration_string are found in
   * {@link include/gradido_blockchain_core/data/duration.h}
   */
  grdu_duration_string: {
    returns: i32,
    args: [cstring, u64, i64, u8],
  },
})

// the same functionality as the nodejs wrapper written in c++ but in TypeScript for using with bun
// because bun on windows currently don't work with nodejs addons compiled with zig compiler (clang)

export function getDecayStartTime(): Date {
  return new Date(Number(grdd_unit_decay_start_time()) * 1000)
}

export function calculateDecay(value: bigint, seconds: bigint): bigint {
  return grdd_unit_calculate_decay(value, seconds)
}

export function gradidoUnitFromString(str: string): bigint {
  // ptr() creates a C pointer from JavaScript TypedArray
  // This pointer represents a memory address that C functions can write to
  // The Int8Array(8) allocates 8 bytes for a 64-bit integer result
  const resultBufferPtr = ptr(new Int8Array(8))

  // C expects null-terminated strings, but JavaScript strings don't have null terminators
  // We create a Buffer with explicit null termination for C compatibility
  const strBuffer = Buffer.from(str + '\0', 'utf8')

  // grdd_unit_from_string writes the parsed result to the memory location pointed to by resultBufferPtr
  // The function returns false if parsing fails
  if (!grdd_unit_from_string(resultBufferPtr, strBuffer)) {
    throw new Error(
      "Invalid unit string. Must be a decimal with up to 4 fractional digits, integer part between -922'337'203'685'476 and 922'337'203'685'476.",
    )
  }

  // read.i64() reads 64-bit integer data from the C pointer back into JavaScript BigInt
  // This retrieves the value that the C function wrote to our allocated memory
  return read.i64(resultBufferPtr)
}

export function gradidoUnitToString(value: bigint, precision?: number): string {
  if (value > 9223372036854775807n || value < -9223372036854775807n) {
    throw new Error('BigInt value is too large to fit in grdd_unit')
  }
  if (precision !== undefined && (precision < 0 || precision > 4)) {
    throw new Error('Precision must be between 0 and 4')
  }

  // Allocate 32 bytes for the C string output buffer
  // C strings are null-terminated, so we need enough space for the formatted result
  const resultBuffer = new Uint8Array(32)

  // ptr() converts the Uint8Array to a C pointer that the native function can write to
  // The pointer represents the starting memory address of our buffer
  const resultBufferPtr = ptr(resultBuffer)

  // grdd_unit_to_string writes the formatted string to our buffer and returns the string length
  // The function takes: buffer pointer, buffer size, value to format, and precision
  const result = grdd_unit_to_string(resultBufferPtr, 32, value, precision ?? 4)
  if (result < 0) {
    throw new Error('Rounding failed (overflow)')
  }

  // Convert the buffer back to a JavaScript string and slice to the actual length
  // The C function wrote the string data to the memory location pointed to by resultBufferPtr
  return Buffer.from(resultBuffer).toString('utf8').slice(0, result)
}

export function toDecimalPlaces(value: bigint, places: number): bigint {
  if (places < 0 || places > 4) {
    throw new Error('Places must be between 0 and 4')
  }
  if (value > 9223372036854775807n || value < -9223372036854775807n) {
    throw new Error('BigInt value is too large to fit in grdd_unit')
  }

  // Allocate 8 bytes for the 64-bit integer result
  // ptr() creates a C pointer to this memory location
  const resultBufferPtr = ptr(new Int8Array(8))

  // grdd_unit_round_to_precision writes the rounded result to the memory pointed to by resultBufferPtr
  // Returns false if rounding fails (overflow)
  if (!grdd_unit_round_to_precision(resultBufferPtr, value, places)) {
    throw new Error('Rounding failed (overflow)')
  }

  // read.i64() reads the 64-bit integer from the C pointer back into JavaScript BigInt
  // This retrieves the rounded value that the C function wrote to our buffer
  return read.i64(resultBufferPtr)
}

export function durationToString(duration: bigint, precision?: number): string {
  // Allocate 32 bytes for the C string output buffer
  const resultBuffer = new Uint8Array(32)

  // ptr() converts the Uint8Array to a C pointer that the native function can write to
  // This pointer represents the memory address where the formatted duration string will be stored
  const resultBufferPtr = ptr(resultBuffer)

  // grdu_duration_string writes the formatted duration string to our buffer
  // Returns the length of the written string
  const result = grdu_duration_string(resultBufferPtr, 32, duration, precision ?? 2)

  // Convert the buffer back to JavaScript string and slice to actual length
  // The C function wrote the string data to the memory location pointed to by resultBufferPtr
  return Buffer.from(resultBuffer).toString('utf8').slice(0, result)
}
