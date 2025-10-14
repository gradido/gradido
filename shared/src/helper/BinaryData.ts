import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '../const'

const logging = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.helper.BinaryData`)

/**
 * Class mainly for handling ed25519 public keys, 
 * to make sure we have always the correct Format (Buffer or Hex String)
 */
export class BinaryData {
  private buf: Buffer
  private hex: string

  constructor(input: Buffer | string | undefined) {
    if (typeof input === 'string') {
      this.buf = Buffer.from(input, 'hex')
      this.hex = input
    } else if (Buffer.isBuffer(input)) {
      this.buf = input
      this.hex = input.toString('hex')
    } else if (input === undefined) {
      this.buf = Buffer.from('')
      this.hex = ''
    } else {
      throw new Error(`Either valid hex string or Buffer expected: ${input}`)
    }
  }

  asBuffer(): Buffer {
    if (this.buf === undefined || !Buffer.isBuffer(this.buf)) {
      if (this.buf) {
        logging.error('invalid buf: ', this.buf)
      }
      throw new Error('buf is invalid')
    }
    return this.buf
  }

  asHex(): string {
    return this.hex
  }

  isSame(other: BinaryData): boolean {
    if (other === undefined || !(other instanceof BinaryData)) {
      logging.error('other is invalid', other)
      return false
    }
    if (logging.isDebugEnabled()) {
      logging.debug('compare hex: ', this.hex, other.asHex(), this.hex === other.asHex())
    }
    return this.buf.compare(other.asBuffer()) === 0
  }
}

export class Ed25519PublicKey extends BinaryData {
  constructor(input: Buffer | string | undefined) {
    super(input)
    if (this.asBuffer().length !== 32) {
      throw new Error('Invalid ed25519 public key length')
    }
  }
}