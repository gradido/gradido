import { blockchain_core } from './library'

export function grddTimestampToDate(timestampHandle: bigint): Date {
  const seconds = Number(blockchain_core.symbols.grdd_timestamp_get_seconds(timestampHandle))
  const nanos = Number(blockchain_core.symbols.grdd_timestamp_get_nanos(timestampHandle))
  if (nanos) {
    return new Date(seconds * 1000 + nanos / 1000)
  } else {
    return new Date(seconds * 1000)
  }
}
