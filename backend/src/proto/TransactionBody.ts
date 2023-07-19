import { Field, Message, OneOf } from '@apollo/protobufjs'

import { CrossGroupType } from '@/graphql/enum/CrossGroupType'

import { TimestampSeconds } from './TimestampSeconds'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class TransactionBody extends Message<TransactionBody> {
  @Field.d(1, 'string')
  public memo: string

  @Field.d(2, TimestampSeconds)
  public createdAt: TimestampSeconds

  @Field.d(3, 'string')
  public versionNumber: string

  @Field.d(4, CrossGroupType)
  public type: CrossGroupType

  @Field.d(5, 'string')
  public otherGroup: string

  @OneOf.d(
    'gradidoTransfer',
    'gradidoCreation',
    'groupFriendsUpdate',
    'registerAddress',
    'gradidoDeferredTransfer',
  )
  public data: string
}
