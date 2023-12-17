import util from 'util'

import { Decimal } from 'decimal.js-light'

import { Timestamp } from '@/data/proto/3_3/Timestamp'
import { TimestampSeconds } from '@/data/proto/3_3/TimestampSeconds'
import { timestampSecondsToDate, timestampToDate } from '@/utils/typeConverter'

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

  public dateToString(date: Date | undefined | null): string | undefined {
    if (date) {
      return date.toISOString()
    }
    return undefined
  }

  public decimalToString(number: Decimal | undefined | null): string | undefined {
    if (number) {
      return number.toString()
    }
    return undefined
  }

  public timestampSecondsToDateString(timestamp: TimestampSeconds): string | undefined {
    if (timestamp && timestamp.seconds) {
      return timestampSecondsToDate(timestamp).toISOString()
    }
  }

  public timestampToDateString(timestamp: Timestamp): string | undefined {
    if (timestamp && (timestamp.seconds || timestamp.nanoSeconds)) {
      return timestampToDate(timestamp).toISOString()
    }
  }
}
