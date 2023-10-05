import { Field, Message } from '@apollo/protobufjs'
import Long from 'long'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class TimestampSeconds extends Message<TimestampSeconds> {
  public constructor(input?: Date | number) {
    let seconds = new Long(0)
    // Calculate seconds from milliseconds
    if (input instanceof Date) {
      seconds = new Long(Math.floor(input.getTime() / 1000))
    } else if (typeof input === 'number') {
      seconds = new Long(Math.floor(input / 1000))
    }
    super({ seconds })
  }

  // Number of complete seconds since the start of the epoch
  @Field.d(1, 'int64')
  public seconds: Long
}
