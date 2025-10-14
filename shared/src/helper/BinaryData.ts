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
    if (!input) {
      logging.debug('constructor() with undefined input')
    }
    logging.debug(`constructor() input type: ${typeof input}`)
    logging.debug(`constructor() input isBuffer: ${Buffer.isBuffer(input)}`)
    logging.debug(`constructor() input: ${input}`)
    if (typeof input === 'string') {
      this.buf = Buffer.from(input, 'hex')
      this.hex = input
    } else if (Buffer.isBuffer(input)) {
      this.buf = input
      this.hex = input.toString('hex')
    } else {
      throw new Error('Either valid hex string or Buffer expected')
    }
  }

  asBuffer(): Buffer {
    return this.buf
  }

  asHex(): string {
    return this.hex
  }

  isSame(other: BinaryData): boolean {
    return this.buf.compare(other.buf) === 0
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