// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getNativeFunction, getBufferPointer } from 'sbffi'
import fs from 'fs'

export class Ed25519 {
  rustDerivePublicKey: any
  rustDerivePrivateKey: any
  rustGetPublicFromPrivateKey: any

  constructor() {
    const libPath = '../../rust_modules/gradido_ed25519_bip32/target/debug/gradido_ed25519_bip32'
    let endung = '.so'
    // .dll.lib'

    if (!fs.existsSync(libPath + endung)) {
      // .so not exist, we maybe on windows
      endung = '.dll.lib'
    }

    this.rustDerivePublicKey = getNativeFunction(libPath + endung, 'derivePublicKey', 'char*', [
      'char*',
      'char*',
      'int32_t',
    ])

    this.rustDerivePrivateKey = getNativeFunction(libPath + endung, 'derivePrivateKey', 'char*', [
      'char*',
      'char*',
      'int32_t',
    ])

    this.rustGetPublicFromPrivateKey = getNativeFunction(
      libPath + endung,
      'getPublicFromPrivateKey',
      'char*',
      ['char*'],
    )
  }

  derivePublicKey(publicKey: string, chainCode: string, index: number): string {
    const publicKeyBuffer = getBufferPointer(publicKey)
    const chainCodeBuffer = getBufferPointer(chainCode)
    const resultBuffer = this.rustDerivePublicKey(publicKeyBuffer, chainCodeBuffer, index)
    return String(resultBuffer)
  }

  derivePrivateKey(privateKey: string, chainCode: string, index: number): string {
    const privateKeyBuffer = getBufferPointer(privateKey)
    const chainCodeBuffer = getBufferPointer(chainCode)
    const resultBuffer = this.rustDerivePublicKey(privateKeyBuffer, chainCodeBuffer, index)
    return String(resultBuffer)
  }

  getPublicFromPrivateKey(privateKey: string): string {
    const privateKeyBuffer = getBufferPointer(privateKey)
    const resultBuffer = this.rustGetPublicFromPrivateKey(privateKeyBuffer)
    return String(resultBuffer)
  }
}
