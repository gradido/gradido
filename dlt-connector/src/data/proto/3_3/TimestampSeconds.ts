import { Field, Message } from 'protobufjs'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class TimestampSeconds extends Message<TimestampSeconds> {
  public constructor(input?: Date | number) {
    let seconds = 0
    // Calculate seconds from milliseconds
    if (input instanceof Date) {
      seconds = Math.floor(input.getTime() / 1000)
    } else if (typeof input === 'number') {
      seconds = Math.floor(input / 1000)
    }
    super({ seconds })
  }

  // Number of complete seconds since the start of the epoch
  @Field.d(1, 'int64')
  public seconds: number
}
