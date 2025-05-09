
export * from '@/node_modules/@types/sodium-native'

declare module 'sodium-native' {
  export function crypto_hash_sha512_init(state: Buffer, key?: Buffer, outlen?: Buffer): void
  export function crypto_hash_sha512_update(state: Buffer, input: Buffer): void
  export function crypto_hash_sha512_final(state: Buffer, out: Buffer): void
}
