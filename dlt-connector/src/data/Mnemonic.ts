// https://www.npmjs.com/package/bip39
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39'
// eslint-disable-next-line camelcase
import { randombytes_buf } from 'sodium-native'

import { LogError } from '@/server/LogError'

export class Mnemonic {
  private _passphrase = ''
  public constructor(seed?: Buffer | string) {
    if (seed) {
      Mnemonic.validateSeed(seed)
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

  public static validateSeed(seed: Buffer | string): void {
    let seedBuffer: Buffer
    if (!Buffer.isBuffer(seed)) {
      seedBuffer = Buffer.from(seed, 'hex')
    } else {
      seedBuffer = seed
    }
    if (seedBuffer.length < 16 || seedBuffer.length > 32 || seedBuffer.length % 4 !== 0) {
      throw new LogError(
        'invalid seed, must be in binary between 16 and 32 Bytes, Power of 4, for more infos: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#generating-the-mnemonic',
        {
          seedBufferHex: seedBuffer.toString('hex'),
          toShort: seedBuffer.length < 16,
          toLong: seedBuffer.length > 32,
          powerOf4: seedBuffer.length % 4,
        },
      )
    }
  }
}
