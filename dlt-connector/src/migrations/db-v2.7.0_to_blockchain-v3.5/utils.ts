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
