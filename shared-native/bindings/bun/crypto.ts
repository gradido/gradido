/**
 * C function declarations for grdc_sign are found in
 * {@link include/gradido_blockchain_core/crypto/sign.h}
 */

import { ptr } from 'bun:ffi'
import {
  blockchain_core,
  SIGN_CHAIN_CODE_SIZE,
  SIGN_PUBLIC_KEY_SIZE,
  SIGN_SEED_SIZE,
  UUID_BINARY_SIZE,
} from './library'

const MAX_DERIVATION_INDEX = 0x80000000 - 1
const KEY_PAIR_SIZE = SIGN_SEED_SIZE + SIGN_PUBLIC_KEY_SIZE + SIGN_CHAIN_CODE_SIZE

export function signKeyPairGenerateFromSeed(seed: Uint8Array): Uint8Array {
  const resultBuffer = new Uint8Array(KEY_PAIR_SIZE)
  const resultBufferPtr = ptr(resultBuffer)
  const seedPtr = ptr(seed)
  const result = blockchain_core.symbols.grdc_sign_key_pair_generate_from_seed(
    resultBufferPtr,
    seedPtr,
    seed.length,
  )
  if (result !== 0) {
    throw new Error(
      `[signKeyPairGenerateFromSeed] Failed to generate ed25519 key pair, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}

export function signKeyPairDerive(parentKeyPair: Uint8Array, index: number): Uint8Array {
  if (parentKeyPair.length !== KEY_PAIR_SIZE) {
    throw new Error(
      `[signKeyPairDerive] Expected parentKeyPair to be ${KEY_PAIR_SIZE} Bytes, got ${parentKeyPair.length}`,
    )
  }
  if (index > MAX_DERIVATION_INDEX) {
    throw new Error(
      `[signKeyPairDerive] Max index value is: ${MAX_DERIVATION_INDEX}, but got: ${index}`,
    )
  }
  const resultBuffer = new Uint8Array(KEY_PAIR_SIZE)

  const resultBufferPtr = ptr(resultBuffer)
  const parentKeyPairPtr = ptr(parentKeyPair)
  const result = blockchain_core.symbols.grdc_sign_key_pair_derive(
    resultBufferPtr,
    parentKeyPairPtr,
    index,
  )
  if (result !== 0) {
    throw new Error(
      `[signKeyPairDerive] Failed to derive child sign key, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}

export function signKeyPairDeriveUuid(parentKeyPair: Uint8Array, uuid: Uint8Array): Uint8Array {
  if (parentKeyPair.length !== KEY_PAIR_SIZE) {
    throw new Error(
      `[signKeyPairDeriveUuid] Expected parentKeyPair to be ${KEY_PAIR_SIZE} Bytes, got ${parentKeyPair.length} bytes`,
    )
  }
  if (uuid.length !== UUID_BINARY_SIZE) {
    throw new Error(
      `[signKeyPairDeriveUuid] Expected a valid uuid (${UUID_BINARY_SIZE} Bytes), got ${uuid.length} bytes`,
    )
  }
  const resultBuffer = new Uint8Array(KEY_PAIR_SIZE)

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
      `[signKeyPairDeriveUuid] Failed to derive account key, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}

export function signKeyPairDeriveAccountFromCommunity(
  communitySeed: Uint8Array,
  userUuid: Uint8Array,
  accountNumber: number = 1,
): Uint8Array {
  if (communitySeed.length !== SIGN_SEED_SIZE) {
    throw new Error(
      `[signKeyPairDeriveAccountFromCommunity] Expected communitySeed to be ${SIGN_SEED_SIZE} Bytes, got ${communitySeed.length}`,
    )
  }
  if (userUuid.length !== UUID_BINARY_SIZE) {
    throw new Error(
      `[signKeyPairDeriveAccountFromCommunity] Expected a valid uuid (${UUID_BINARY_SIZE} Bytes), got ${userUuid.length} bytes`,
    )
  }
  if (accountNumber > MAX_DERIVATION_INDEX) {
    throw new Error(
      `[signKeyPairDeriveAccountFromCommunity] Max index value is: ${MAX_DERIVATION_INDEX}, but got: ${accountNumber}`,
    )
  }
  const resultBuffer = new Uint8Array(KEY_PAIR_SIZE)

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
      `[signKeyPairDeriveAccountFromCommunity] Failed to derive account key, result: ${blockchain_core.symbols.grd_result_to_string(result)}`,
    )
  }
  return resultBuffer
}
