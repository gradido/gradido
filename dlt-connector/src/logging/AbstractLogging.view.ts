import { Decimal } from 'decimal.js-light'

export abstract class AbstractLoggingView {
  protected bufferStringFormat: BufferEncoding = 'hex'

  // This function gets called automatically when JSON.stringify() is called on this class instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public abstract toJSON(): any
  public toString(): string {
    return JSON.stringify(this, null, 2)
  }

  public dateToString(date: Date | undefined | null): string | null {
    if (date) {
      return date.toISOString()
    }
    return null
  }

  public decimalToString(number: Decimal | undefined | null): string | null {
    if (number) {
      return number.toString()
    }
    return null
  }
}
