import { Field, Message } from '@apollo/protobufjs'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class TimestampSeconds extends Message<TimestampSeconds> {
  // Number of complete seconds since the start of the epoch
  @Field.d(1, 'int64')
  public seconds: number
}
