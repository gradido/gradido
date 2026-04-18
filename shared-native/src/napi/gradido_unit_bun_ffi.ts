import { dlopen, FFIType } from 'bun:ffi'
import path from 'path'
import { getCoreFileName } from '../../build_helper/host_configuration'

const { i64 } = FFIType

const filePath = path.resolve(__dirname, `../../build/${getCoreFileName()}`)
// direct importing c library via ffi, without nodejs addon wrapper
const {
  symbols: { grdd_unit_decay_start_time, grdd_unit_calculate_decay },
} = dlopen(filePath, {
  grdd_unit_decay_start_time: {
    returns: i64,
    args: [],
  },
  grdd_unit_calculate_decay: {
    returns: i64,
    args: [i64, i64],
  },
})

// replace nodejs wrapper written in c++ with this in TypeScript Written Wrappers

export function getDecayStartTime(): Date {
  return new Date(Number(grdd_unit_decay_start_time()) * 1000)
}

export function calculateDecay(value: bigint, seconds: bigint): bigint {
  return grdd_unit_calculate_decay(value, seconds)
}
