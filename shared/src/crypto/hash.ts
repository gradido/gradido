import { hashGeneric as nativeHashGeneric } from 'shared-native'

export function hashGeneric(data: string | Buffer): Buffer {
  let localData: Uint8Array | undefined
  if (typeof data === 'string') {
    localData = new Uint8Array(Buffer.from(data, 'hex'))
  } else {
    localData = new Uint8Array(data)
  }
  return Buffer.from(nativeHashGeneric(localData))
}
