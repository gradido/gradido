import { Decimal } from 'decimal.js-light'
import util from 'util'

export abstract class AbstractLoggingView {
  protected bufferStringFormat: BufferEncoding = 'hex'

  // This function gets called automatically when JSON.stringify() is called on this class instance

  public abstract toJSON(): any
  public toString(compact = false): string {
    if (compact) {
      return JSON.stringify(this.toJSON())
    } else {
      return JSON.stringify(this.toJSON(), null, 2)
    }
  }

  // called form console.log or log4js logging functions
  [util.inspect.custom](): string {
    return this.toString()
  }

  public dateToString(date: Date | undefined | null): string | undefined {
    if (date) {
      if (date instanceof Date) {
        return date.toISOString()
      } else {
        return new Date(date).toISOString()
      }
    }
    return undefined
  }

  public decimalToString(number: Decimal | undefined | null): string | undefined {
    if (number) {
      return number.toString()
    }
    return undefined
  }
}
