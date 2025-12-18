import Decimal from 'decimal.js-light'
import { crypto_generichash_batch, crypto_generichash_KEYBYTES } from 'sodium-native'

export function bytesToMbyte(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(4)
}

export function bytesToKbyte(bytes: number): string {
  return (bytes / 1024).toFixed(0)
}

export function calculateOneHashStep(hash: Buffer, data: Buffer): Buffer<ArrayBuffer> {
  const outputHash = Buffer.alloc(crypto_generichash_KEYBYTES, 0)
  crypto_generichash_batch(outputHash, [hash, data])
  return outputHash
}

export const DECAY_START_TIME = new Date('2021-05-13T17:46:31Z')
export const SECONDS_PER_YEAR_GREGORIAN_CALENDER = 31556952.0

export function legacyDecayFormula(value: Decimal, seconds: number): Decimal {
  // TODO why do we need to convert this here to a string to work properly?
  // chatgpt: We convert to string here to avoid precision loss:
  //          .pow(seconds) can internally round the result, especially for large values of `seconds`.
  //          Using .toString() ensures full precision is preserved in the multiplication.
  return value.mul(
    new Decimal('0.99999997803504048973201202316767079413460520837376').pow(seconds).toString(),
  )
}

export function legacyCalculateDecay(amount: Decimal, from: Date, to: Date): Decimal {
  const fromMs = from.getTime()
  const toMs = to.getTime()
  const startBlockMs = DECAY_START_TIME.getTime()

  if (toMs < fromMs) {
    throw new Error('calculateDecay: to < from, reverse decay calculation is invalid')
  }

  // decay started after end date; no decay
  if (startBlockMs > toMs) {
    return amount
  }
  // decay started before start date; decay for full duration
  let duration = (toMs - fromMs) / 1000
  
  // decay started between start and end date; decay from decay start till end date
  if (startBlockMs >= fromMs) {
    duration = (toMs - startBlockMs) / 1000
  }
  return legacyDecayFormula(amount, duration)
}
