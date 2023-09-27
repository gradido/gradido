import { Field, Message } from '@apollo/protobufjs'
import { GradidoTransaction } from './GradidoTransaction'
import { TimestampSeconds } from './TimestampSeconds'

/*
	id will be set by Node server
	running_hash will be also set by Node server,
	  calculated from previous transaction running_hash and this id, transaction and received
*/

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoConfirmedTransaction extends Message<GradidoConfirmedTransaction> {
  @Field.d(1, 'uint64')
  id: number

  @Field.d(2, 'GradidoTransaction')
  transaction: GradidoTransaction

  @Field.d(3, 'TimestampSeconds')
  confirmedAt: TimestampSeconds

  @Field.d(4, 'string')
  versionNumber: string

  @Field.d(5, 'bytes')
  runningHash: Buffer

  @Field.d(6, 'bytes')
  messageId: Buffer

  @Field.d(7, 'string')
  accountBalance: string
}
