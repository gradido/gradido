import { dlopen, suffix, FFIType } from 'bun:ffi'
import { fileURLToPath } from 'url'
const { i64 } = FFIType

const path = fileURLToPath(new URL(`../../build/core.${suffix}`, import.meta.url))
const {
    symbols: {
      grdd_unit_decay_start_time,
      grdd_unit_calculate_decay
    },
} = dlopen(path, {
  grdd_unit_decay_start_time: {
    returns: i64,
    args: [],
  },
  grdd_unit_calculate_decay: {
    returns: i64,
    args: [i64, i64],
  }
})

export function getDecayStartTime(): Date {
  return new Date(Number(grdd_unit_decay_start_time()) * 1000)
}

export function calculateDecay(value: bigint, seconds: bigint): bigint {
  return grdd_unit_calculate_decay(value, seconds)
}
