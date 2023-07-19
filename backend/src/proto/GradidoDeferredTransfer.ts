import { Field, Message } from '@apollo/protobufjs'

import { GradidoTransfer } from './GradidoTransfer'
import { Timestamp } from './Timestamp'

// transaction type for chargeable transactions
// for transaction for people which haven't a account already
// consider using a seed number for key pair generation for recipiant
// using seed as redeem key for claiming transaction, technically make a default Transfer transaction from recipiant address
// seed must be long enough to prevent brute force, maybe base64 encoded
// to own account
// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoDeferredTransfer extends Message<GradidoDeferredTransfer> {
  // amount is amount with decay for time span between transaction was received and timeout
  // useable amount can be calculated
  // recipient address don't need to be registered in blockchain with register address
  @Field.d(1, GradidoTransfer)
  public transfer: GradidoTransfer

  // if timeout timestamp is reached if it wasn't used, it will be booked back minus decay
  // technically on blockchain no additional transaction will be created because how should sign it?
  // the decay for amount and the seconds until timeout is lost no matter what happened
  // consider is as fee for this service
  // rest decay could be transferred back as separate transaction
  @Field.d(2, 'Timestamp')
  public timeout: Timestamp

  // split for n recipient
  // max gradido per recipient? or per transaction with cool down?
}
