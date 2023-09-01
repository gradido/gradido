import { Field, Message, OneOf } from '@apollo/protobufjs'

import { CrossGroupType } from '@/graphql/enum/CrossGroupType'

import { TimestampSeconds } from './TimestampSeconds'
import { GradidoTransfer } from './GradidoTransfer'
import { GradidoCreation } from './GradidoCreation'
import { GradidoDeferredTransfer } from './GradidoDeferredTransfer'
import { GroupFriendsUpdate } from './GroupFriendsUpdate'
import { RegisterAddress } from './RegisterAddress'

/*interface OneofExample {
  result:
    | { oneofKind: 'value'; value: number }
    | { oneofKind: 'error'; error: string }
    | { oneofKind: undefined }
}*/

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

  @Field.d(6, 'GradidoTransfer')
  transfer?: GradidoTransfer

  @Field.d(7, 'GradidoCreation')
  creation?: GradidoCreation

  @Field.d(8, 'GroupFriendsUpdate')
  groupFriendsUpdate?: GroupFriendsUpdate

  @Field.d(9, 'RegisterAddress')
  registerAddress?: RegisterAddress

  @Field.d(10, 'GradidoDeferredTransfer')
  deferredTransfer?: GradidoDeferredTransfer
}
