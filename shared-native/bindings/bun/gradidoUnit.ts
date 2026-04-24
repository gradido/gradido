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
  grdu_duration_string: {
    returns: i32,
    args: [cstring, u64, i64, u8],
  },
})

// replace nodejs wrapper written in c++ with this in TypeScript Written Wrappers

export function getDecayStartTime(): Date {
  return new Date(Number(grdd_unit_decay_start_time()) * 1000)
}

export function calculateDecay(value: bigint, seconds: bigint): bigint {
  return grdd_unit_calculate_decay(value, seconds)
}

export function gradidoUnitFromString(str: string): bigint {
  const resultBufferPtr = ptr(new Int8Array(8))
  // c expect \0 terminated string, but JavaScript don't auto null terminate strings
  const strBuffer = Buffer.from(str + '\0', 'utf8')
  if (!grdd_unit_from_string(resultBufferPtr, strBuffer)) {
    console.log('Failed to parse string:', str, read.i64(resultBufferPtr).toString())
    throw new Error(
      "Invalid unit string. Must be a decimal with up to 4 fractional digits, integer part between -922'337'203'685'476 and 922'337'203'685'476.",
    )
  }
  return read.i64(resultBufferPtr)
}

export function gradidoUnitToString(value: bigint, precision?: number): string {
  if (value > 9223372036854775807n || value < -9223372036854775807n) {
    throw new Error('BigInt value is too large to fit in grdd_unit')
  }
  if (precision !== undefined && (precision < 0 || precision > 4)) {
    throw new Error('Precision must be between 0 and 4')
  }
  const resultBuffer = new Uint8Array(32)
  const resultBufferPtr = ptr(resultBuffer)
  const result = grdd_unit_to_string(resultBufferPtr, 32, value, precision ?? 4)
  if (result < 0) {
    throw new Error('Rounding failed (overflow)')
  }
  return Buffer.from(resultBuffer).toString('utf8').slice(0, result)
}

export function toDecimalPlaces(value: bigint, places: number): bigint {
  if (places < 0 || places > 4) {
    throw new Error('Places must be between 0 and 4')
  }
  if (value > 9223372036854775807n || value < -9223372036854775807n) {
    throw new Error('BigInt value is too large to fit in grdd_unit')
  }
  const resultBufferPtr = ptr(new Int8Array(8))
  if (!grdd_unit_round_to_precision(resultBufferPtr, value, places)) {
    throw new Error('Rounding failed (overflow)')
  }
  return read.i64(resultBufferPtr)
}

export function durationToString(duration: bigint, precision?: number): string {
  const resultBuffer = new Uint8Array(32)
  const resultBufferPtr = ptr(resultBuffer)
  const result = grdu_duration_string(resultBufferPtr, 32, duration, precision ?? 2)
  return Buffer.from(resultBuffer).toString('utf8').slice(0, result)
}
