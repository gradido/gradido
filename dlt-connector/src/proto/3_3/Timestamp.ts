import { Field, Message } from '@apollo/protobufjs'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class Timestamp extends Message<Timestamp> {
  public constructor(input?: Date | number) {
    let seconds = 0
    let nanoSeconds = 0
    if (input instanceof Date) {
      seconds = Math.floor(input.getTime() / 1000)
      nanoSeconds = (input.getTime() % 1000) * 1000000 // Convert milliseconds to nanoseconds
    } else if (typeof input === 'number') {
      // Calculate seconds and nanoseconds from milliseconds
      seconds = Math.floor(input / 1000)
      nanoSeconds = (input % 1000) * 1000000
    }
    super({ seconds, nanoSeconds })
  }

  // Number of complete seconds since the start of the epoch
  @Field.d(1, 'int64')
  public seconds: number

  // Number of nanoseconds since the start of the last second
  @Field.d(2, 'int32')
  public nanoSeconds: number
}
