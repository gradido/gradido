/**
 * The same functionality as the nodejs wrapper written in c++ but in TypeScript for using with bun
 * because bun on windows currently don't work with nodejs addons compiled with zig compiler (clang)
 *
 * Bun FFI lets you call native C functions directly from JavaScript.
 * {@link https://bun.com/docs/runtime/ffi}
 * You manually describe the function signatures (arguments and return types),
 * and Bun handles calling them at runtime.
 * Key concepts:
 * - dlopen: loads native library and exposes symbols (functions)
 * - ptr() gives C access to the raw memory of this array.
 *   Important: the memory is owned by JavaScript.
 *   C can write into it, but must NOT free or reallocate it.
 * - read: reads raw memory at a pointer and interprets it as a specific type (e.g. i64)
 * - FFIType: defines type mappings between JS and C types
 */

import { dlopen, FFIType } from 'bun:ffi'
import path from 'path'
import { getCoreFileName } from '../../build_helper/host_configuration'

const { i64, u64, i32, u32, bool, cstring, pointer, u8 } = FFIType

const filePath = path.resolve(__dirname, `../../build/${getCoreFileName()}`)
// direct importing c library via ffi, without nodejs addon wrapper
export const blockchain_core = dlopen(filePath, {
  grd_result_to_string: {
    returns: cstring,
    args: [i32],
  },
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
  /**
   * C function declarations for grdc_sign are found in
   * {@link include/gradido_blockchain_core/crypto/sign.h}
   */
  grdc_sign_key_pair_generate_from_seed: {
    returns: i32,
    args: [pointer, pointer, u64],
  },
  grdc_sign_key_pair_derive: {
    returns: i32,
    args: [pointer, pointer, u32],
  },
  grdc_sign_key_pair_derive_uuid: {
    returns: i32,
    args: [pointer, pointer, pointer],
  },
  grdc_sign_key_pair_derive_account_from_community: {
    returns: i32,
    args: [pointer, pointer, pointer, u32],
  },
  /**
   * C function declarations for grdc_hash are found in
   * {@link include/gradido_blockchain_core/crypto/hash.h}
   */
  grdc_hash_generic: {
    returns: i32,
    args: [pointer, pointer, u64],
  },
  /**
   * enum type to string functions from include/gradido_blockchain_core/types/
   */
  grdt_address_to_string: {
    returns: cstring,
    args: [i32],
  },
  grdt_balance_derivation_to_string: {
    returns: cstring,
    args: [i32],
  },
  grdt_cross_group_to_string: {
    returns: cstring,
    args: [i32],
  },
  grdt_ledger_anchor_to_string: {
    returns: cstring,
    args: [i32],
  },
  grdt_memo_key_to_string: {
    returns: cstring,
    args: [i32],
  },
  grdt_transaction_to_string: {
    returns: cstring,
    args: [i32],
  },
})
