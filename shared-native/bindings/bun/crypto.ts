/**
 * C function declarations for grdc_sign are found in
 * {@link include/gradido_blockchain_core/crypto/sign.h}
 */

import { ptr } from 'bun:ffi'
import { blockchain_core } from './library'

/*
grd_result grdc_sign_key_pair_generate_from_seed(
    grdc_sign_key_pair *esign_key_pair, const uint8_t *seed, const size_t seed_size
);
*/

const MAX_DERIVATION_INDEX = 0x80000000 - 1

export function signKeyPairGenerateFromSeed(seed: Uint8Array): Uint8Array {
  const resultBuffer = new Uint8Array(96)
  const resultBufferPtr = ptr(resultBuffer)
  const seedPtr = ptr(seed)
  const result = blockchain_core.symbols.grdc_sign_key_pair_generate_from_seed(
    resultBufferPtr,
    seedPtr,
    seed.length,
  )
  if (result !== 0) {
    throw new Error(
      `Failed to generate ed25519 key pair, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}

export function signKeyPairDerive(parentKeyPair: Uint8Array, index: number): Uint8Array {
  if (parentKeyPair.length !== 96) {
    throw new Error(`Expected parentKeyPair to be 96 Bytes, got ${parentKeyPair.length}`)
  }
  if (index > MAX_DERIVATION_INDEX) {
    throw new Error(`Max index value is: ${MAX_DERIVATION_INDEX}, but got: ${index}`)
  }
  const resultBuffer = new Uint8Array(96)

  const resultBufferPtr = ptr(resultBuffer)
  const parentKeyPairPtr = ptr(parentKeyPair)
  const result = blockchain_core.symbols.grdc_sign_key_pair_derive(
    resultBufferPtr,
    parentKeyPairPtr,
    index,
  )
  if (result !== 0) {
    throw new Error(
      `Failed to derive child sign key, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}

export function signKeyPairDeriveUuid(parentKeyPair: Uint8Array, uuid: Uint8Array): Uint8Array {
  if (parentKeyPair.length !== 96) {
    throw new Error(`Expected parentKeyPair to be 96 Bytes, got ${parentKeyPair.length} bytes`)
  }
  if (uuid.length !== 16) {
    throw new Error(`Expected a valid uuid (16 Bytes), got ${uuid.length} bytes`)
  }
  const resultBuffer = new Uint8Array(96)

  const parentKeyPairPtr = ptr(parentKeyPair)
  const uuidPtr = ptr(uuid)
  const resultBufferPtr = ptr(resultBuffer)

  const result = blockchain_core.symbols.grdc_sign_key_pair_derive_uuid(
    resultBufferPtr,
    parentKeyPairPtr,
    uuidPtr,
  )
  if (result !== 0) {
    throw new Error(
      `Failed to derive account key, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}

export function signKeyPairDeriveAccountFromCommunity(
  communitySeed: Uint8Array,
  userUuid: Uint8Array,
  accountNumber: number = 1,
): Uint8Array {
  if (communitySeed.length !== 32) {
    throw new Error(`Expected communitySeed to be 32 Bytes, got ${communitySeed.length}`)
  }
  if (userUuid.length !== 16) {
    throw new Error(`Expected a valid uuid (16 Bytes), got ${userUuid.length} bytes`)
  }
  if (accountNumber > MAX_DERIVATION_INDEX) {
    throw new Error(`Max index value is: ${MAX_DERIVATION_INDEX}, but got: ${accountNumber}`)
  }
  const resultBuffer = new Uint8Array(96)

  const communitySeedPtr = ptr(communitySeed)
  const userUuidPtr = ptr(userUuid)
  const resultBufferPtr = ptr(resultBuffer)

  const result = blockchain_core.symbols.grdc_sign_key_pair_derive_account_from_community(
    resultBufferPtr,
    communitySeedPtr,
    userUuidPtr,
    accountNumber,
  )
  if (result !== 0) {
    throw new Error(
      `Failed to derive account key, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}
