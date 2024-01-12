// https://www.npmjs.com/package/bip39
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39'
// eslint-disable-next-line camelcase
import { randombytes_buf } from 'sodium-native'

export class Mnemonic {
  private _passphrase = ''
  public constructor(seed?: Buffer | string) {
    if (seed) {
      this._passphrase = entropyToMnemonic(seed)
      return
    }
    const entropy = Buffer.alloc(256)
    randombytes_buf(entropy)
    this._passphrase = entropyToMnemonic(entropy)
  }

  public get passphrase(): string {
    return this._passphrase
  }

  public get seed(): Buffer {
    return mnemonicToSeedSync(this._passphrase)
  }
}
