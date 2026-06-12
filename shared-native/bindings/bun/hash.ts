/**
 * C function declarations for grdc_hash are found in
 * {@link include/gradido_blockchain_core/crypto/hash.h}
 */

// grd_result grdc_generic_hash(uint8_t *hash, const uint8_t *data, size_t size)
//
import { ptr } from 'bun:ffi'
import { blockchain_core, GENERIC_HASH_SIZE } from './library'

export function hashGeneric(data: Uint8Array): Uint8Array {
  const dataPtr = ptr(data)
  const resultBuffer = new Uint8Array(GENERIC_HASH_SIZE)
  const resultBufferPtr = ptr(resultBuffer)
  const result = blockchain_core.symbols.grdc_hash_generic(resultBufferPtr, dataPtr, data.length)
  if (result !== 0) {
    throw new Error(
      `Failed to calculate generic hash, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}
