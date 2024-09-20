import util from 'util'

import { Decimal } from 'decimal.js-light'
import { Timestamp, TimestampSeconds } from 'gradido-blockchain-js'

export abstract class AbstractLoggingView {
  protected bufferStringFormat: BufferEncoding = 'hex'

  // This function gets called automatically when JSON.stringify() is called on this class instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public abstract toJSON(): any
  public toString(): string {
    return JSON.stringify(this.toJSON(), null, 2)
  }

  // called form console.log or log4js logging functions
  [util.inspect.custom](): string {
    return this.toString()
  }

  protected dateToString(date: Date | undefined | null): string | undefined {
    if (date) {
      return date.toISOString()
    }
    return undefined
  }

  protected decimalToString(number: Decimal | undefined | null): string | undefined {
    if (number) {
      return number.toString()
    }
    return undefined
  }

  protected timestampSecondsToDateString(timestamp: TimestampSeconds): string | undefined {
    if (timestamp && timestamp.getSeconds()) {
      return timestamp.getDate().toISOString()
    }
  }

  protected timestampToDateString(timestamp: Timestamp): string | undefined {
    if (timestamp && (timestamp.getSeconds() || timestamp.getNanos())) {
      return timestamp.getDate().toISOString()
    }
  }
}
