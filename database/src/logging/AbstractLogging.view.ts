import { Decimal } from 'decimal.js-light'
import { GradidoUnit } from 'shared'
import util from 'util'

export abstract class AbstractLoggingView {
  protected bufferStringFormat: BufferEncoding = 'hex'

  // This function gets called automatically when JSON.stringify() is called on this class instance

  public abstract toJSON(): any

  // if I have forgotten a bigint in the object, this will convert it to string
  safeStringify(obj: any) {
    return JSON.stringify(obj, (_, value) => typeof value === 'bigint' ? value.toString() : value)
  }

  public toString(compact = false): string {
    if (compact) {
      return this.safeStringify(this.toJSON())
    } else {
      return this.safeStringify(this.toJSON())
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
  public gradidoUnitToString(gdd: GradidoUnit | undefined | null): string | undefined {
    if (gdd) {
      return gdd.toString()
    }
    return undefined
  }
}
