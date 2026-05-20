import { crypto_generichash_batch, crypto_generichash_KEYBYTES } from 'sodium-native'

export function bytesToMbyte(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(4)
}

export function bytesToKbyte(bytes: number): string {
  return (bytes / 1024).toFixed(0)
}

export function bytesString(bytes: number): string {
  if (bytes > 1024 * 1024) {
    return `${bytesToMbyte(bytes)} MB`
  } else if (bytes > 1024) {
    return `${bytesToKbyte(bytes)} KB`
  }
  return `${bytes.toFixed(0)} Bytes`
}

export function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 23).replace('T', ' ')
}

export function calculateOneHashStep(hash: Buffer, data: Buffer): Buffer<ArrayBuffer> {
  const outputHash = Buffer.alloc(crypto_generichash_KEYBYTES, 0)
  crypto_generichash_batch(outputHash, [hash, data])
  return outputHash
}
