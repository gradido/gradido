import { Field, Message } from '@apollo/protobufjs'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class Timestamp extends Message<Timestamp> {
  // Number of complete seconds since the start of the epoch
  @Field.d(1, 'int64')
  public seconds: number

  // Number of nanoseconds since the start of the last second
  @Field.d(2, 'int32')
  public nanoSeconds: number
}
